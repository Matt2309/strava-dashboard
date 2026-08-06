# GDPR Compliance Report — Dromos

> **Avvertenza**: Questa è un'analisi tecnica del codice, non un parere legale. Per la conformità definitiva, consulta un avvocato privacy/DPO.
>
> **Data analisi**: 2026-06-11
> **Branch**: feature/GDPR-compliancy
> **Analizzato da**: Claude Code (Sonnet 4.6)

---

## 1. SUMMARY TABLE

| Stato | Sezioni                                                                                                                                                                                          | # Punti |
|-------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| ✅ CONFORME | Consent flow registrazione, versioning policy, framework env vars, ORM SQL-safe, Strava token refresh, soft-purge `rawJson` (logica)                                                             | ~8 |
| ⚠️ PARZIALE | GTM consent mode, pseudonimizzazione ID interni, password hashing (delegato a better-auth), Privacy Policy visibile, cascaded deletes                                                            | ~12 |
| ❌ NON CONFORME | Purge mai eseg0uito, nessun Right to Erasure UI, nessun data export, nessun rate limiting, token OAuth in chiaro, nessun audit log, nessun 2FA, nessun DPA documentato, nessuna procedura breach | ~22 |

**Top 3 aree forti:**
1. Consent tracking con timestamp + versioning policy/terms
2. `rawJson` purge dopo 7 giorni (architettura corretta)
3. Env vars per tutti i segreti, nessun secret hardcoded

**Top 3 aree critiche:**
1. Diritti GDPR dell'utente completamente assenti (erasure, export, rettifica)
2. Purge dei dati sensibili è codice morto — non viene mai eseguito
3. Token OAuth Strava salvati in chiaro nel DB

---

## 2. ANALISI PER SEZIONE

### SEZIONE 1 — CONSENT MANAGEMENT

#### 1.1 Consent Flow

> **Aggiornamento 2026-08-03**: l'analisi originale copriva solo `RegisterForm.tsx` (email/password). È emerso che un utente che si registrava cliccando direttamente "Continue with Google/Strava" nel `LoginForm` (bypassando `/register`) entrava nell'app senza aver mai accettato Privacy Policy/Termini, perché `databaseHooks.user.create.before` in `lib/auth.ts` timbrava il consenso incondizionatamente per ogni nuovo utente, qualunque fosse il provider — e questo impediva anche al wall di ricomparire in seguito. **Corretto**: rimosso il timbro automatico; il consenso ora è sempre scritto esplicitamente via `acceptLegalDocuments` (router `compliance`), o dal form di registrazione dopo il check della checkbox, o dal nuovo `LegalConsentWall` mostrato ai signup OAuth (e a chi non ha ancora consentito) prima di qualunque altra pagina in `(user-app)/layout.tsx`. I 4 campi di consenso sono anche stati marcati `input: false` in `lib/auth.ts` per impedire che un client possa auto-certificarsi il consenso tramite `signUp`.

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| Consenso esplicito (opt-in, non pre-checked) | ✅ CONFORME | `RegisterForm.tsx`: `policyAccepted` inizia `false`, checkbox unchecked, submit disabilitato finché non spuntato. `LoginForm.tsx` (Google/Strava): nessuna checkbox nel form stesso, ma il consenso viene richiesto obbligatoriamente dal `LegalConsentWall` al primo accesso post-OAuth, prima che l'utente veda qualunque contenuto |
| Tracciato con timestamp + versione policy | ✅ CONFORME | `privacyConsentTimestamp`, `privacyPolicyId` (e i corrispettivi per `termsConditions`) salvati sul `User`; `acceptLegalDocuments` li aggiorna solo su azione esplicita dell'utente |
| Meccanismo di REVOCA del consenso | ⚠️ PARZIALE | **Aggiornamento 2026-08-03**: aggiunto "Elimina account" nella tab utente (`components/sidebar/nav-user.tsx`), che copre la revoca totale (cancellazione dell'account) via procedura oRPC `compliance.deleteAccount`. Manca ancora una revoca *parziale* granulare (es. solo analytics) senza cancellare l'intero account — vedi punto 7.1 |
| Consenso granulare (analytics vs dati attività vs salute) | ❌ NON CONFORME | Il consenso è binario: accetti tutto o non usi l'app. `averageHeartrate` (dato sanitario) non ha consenso separato |
| Cosa succede se l'utente revoca | ⚠️ PARZIALE | Il flusso di revoca implementato è "elimina account": `compliance.deleteAccount` revoca l'autorizzazione Strava (best-effort) e cancella permanentemente `User` (cascade Prisma su `Session`, `Account`, `Activity`, `GearFunctional`, `GearDevice`, `UserStatistics`). Non esiste un percorso di revoca che mantenga l'account attivo con trattamento ridotto |
| Consenso raccolto prima di qualunque elaborazione dati (incl. via API/webhook) | ⚠️ PARZIALE | Il gate vive nel layout `(user-app)`, quindi copre le pagine ma non le procedure oRPC né `/api/strava/webhook`: un'attività potrebbe teoricamente essere persistita via webhook per un utente che non ha ancora attraversato il `LegalConsentWall`. Da valutare come follow-up |

#### 1.2 Privacy Notice

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| Privacy Policy visibile prima del signup | ✅ CONFORME | Link in `RegisterForm.tsx`, route `/privacy-policy` è `PUBLIC` |
| Chiara e in italiano | ⚠️ PARZIALE | UI in italiano; il contenuto è in DB (Markdown), non verificabile da codice |
| Spiega cosa/perché/base legale/diritti/retention/trasferimenti | ⚠️ SCONOSCIUTO | Contenuto in DB, non verificabile da codice. Da verificare manualmente |
| Link a Garante Privacy Italia | ⚠️ SCONOSCIUTO | Stesso motivo |

---

### SEZIONE 2 — DATI SENSIBILI

#### 2.1 Minimizzazione

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| Solo dati necessari | ⚠️ PARZIALE | `averageHeartrate`, `sufferScore` e `rawJson` (GPS completo) vengono salvati. `rawJson` contiene l'intera risposta Strava API: GPS, frequenza cardiaca, potenza, ecc. — dati di categoria speciale (Art. 9 GDPR) |
| Documentazione su perché ogni campo sensibile è obbligatorio | ❌ NON CONFORME | Nessun commento/doc che spiega la necessità di `averageHeartrate` o `sufferScore` per la funzionalità core |
| Dati usati solo per scopi dichiarati | ⚠️ PARZIALE | GTM viene caricato su **tutte le pagine** incluse quelle autenticate, potenzialmente tracciando comportamenti dell'utente autenticato. `analytics_storage` è `denied` by default, ma GTM stesso si carica sempre |

#### 2.2 Crittografia

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| Encryption at rest | ⚠️ PARZIALE | **Aggiornamento 2026-08-03**: `Account.accessToken`/`refreshToken`/`idToken` sono ora cifrati AES-256-GCM (`lib/prisma-extensions/account-token-encryption.ts`, chiave `ENCRYPTION_KEY`) in modo trasparente su ogni read/write, incluse le operazioni interne di better-auth. `rawJson`, email, nome restano in plaintext — solo i token OAuth erano nel gap #4 |
| Encryption in transit (HTTPS/TLS) | ⚠️ SCONOSCIUTO | Dipende dall'infrastruttura di hosting; non configurato nel codice |
| Client-side encryption | ❌ NON CONFORME | Non implementata |
| Gestione chiavi di crittografia | ❌ NON CONFORME | Non applicabile — nessuna crittografia presente |

#### 2.3 Accesso ai Dati

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| 2FA/MFA | ❌ NON CONFORME | `better-auth` supporta il plugin `twoFactor` ma non è configurato in `lib/auth.ts` |
| Log degli accessi ai dati sensibili | ❌ NON CONFORME | Solo `console.error` per gli errori. Nessun access log strutturato |
| Audit trail protetto | ❌ NON CONFORME | Non esiste |
| Role-based access control | ❌ NON CONFORME | Nessuna distinzione admin/user nel codice; tutte le procedure sono accessibili a qualsiasi utente autenticato |

---

### SEZIONE 3 — RETENTION E CANCELLAZIONE

#### 3.1 Data Retention Policy

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| Policy scritta su retention | ⚠️ PARZIALE | `PURGE_AFTER_DAYS = 7` hardcoded per `rawJson`. Nessuna policy per gli altri dati (attività aggregate, gear, statistiche) |
| Implementata nel codice | ✅ CONFORME | `purgeStaleActivityData()` è invocata da `GET /api/cron/purge-raw-data` (protetta da `CRON_SECRET`), a sua volta chiamata ogni notte da `.github/workflows/purge-raw-data.yml`. Aggiornata a un singolo `updateMany` per efficienza |
| Comunicata in Privacy Policy | ⚠️ SCONOSCIUTO | Contenuto in DB |

#### 3.2 Right to Erasure (Art. 17)

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| L'utente può richiedere cancellazione di tutti i dati | ✅ CONFORME | **Aggiornamento 2026-08-03**: "Elimina account" in tab utente → procedura oRPC `compliance.deleteAccount`, con conferma a 2 step (l'utente deve digitare "ELIMINA"). Best-effort revoca anche l'autorizzazione Strava (`POST /oauth/deauthorize`) prima di cancellare |
| Cancellazione permanente | ✅ CONFORME | Prisma `onDelete: Cascade` su `Session`, `Account`, `Activity`, `GearFunctional`, `GearDevice`, `UserStatistics` — ora effettivamente attivato da `prisma.user.delete` in `server/repositories/user.repository.ts` (`deleteUserById`), chiamato da `deleteUserAccount()` nel service. Nota: `PrivacyPolicy`/`TermsConditions` sono sul lato opposto della relazione (FK su `User`), quindi il record di consenso storico dell'utente sparisce con l'account — coerente con l'erasure ma da tenere presente se in futuro serve provare lo storico consensi anche dopo la cancellazione |
| Latenza documentata | ❌ NON CONFORME | La cancellazione è sincrona e immediata lato codice, ma non esiste un documento che dichiari una latenza massima (es. "entro 30 giorni") come richiesto dall'Art. 12(3) per le richieste formali |
| Procedura di verifica cancellazione | ⚠️ PARZIALE | Il redirect a `/login` post-cancellazione e l'impossibilità di autenticarsi con le stesse credenziali fungono da verifica implicita lato utente. Manca una procedura documentata/audit log che attesti la cancellazione per finalità di accountability (Art. 5(2)) |

#### 3.3 Anonymizzazione

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| Anonymizzazione dei dati che non possono essere cancellati | ❌ NON CONFORME | `UserStatistics` aggregate non vengono cancellate con l'utente in modo strutturato; nessun piano di anonimizzazione |

---

### SEZIONE 4 — DATA SUBJECT RIGHTS

| Diritto | Stato | Motivazione |
|---------|-------|-------------|
| Art. 15 — Right of Access (scarica tutti i dati) | ✅ CONFORME | **Aggiornamento 2026-08-03**: "Scarica i miei dati" in tab utente → procedura oRPC `compliance.exportUserData`, scarica un file JSON (profilo, consensi, account collegati senza token, attività incluso `rawJson` non ancora purgato, gear, statistiche) |
| Art. 16 — Rectification (correggi dati) | ❌ NON CONFORME | Nessuna UI di profilo per modificare nome/email visibile nel codice |
| Art. 20 — Portability (export machine-readable) | ✅ CONFORME | Lo stesso export di cui sopra produce JSON strutturato, leggibile da macchina — soddisfa anche la portabilità, oltre a `exportToToon` che resta un export per singola attività ad uso diverso |
| Art. 21 — Right to Object / opt-out per trattamento | ❌ NON CONFORME | Nessuna UI per gestire preferenze analytics o opt-out da specifici trattamenti. GTM consent mode è gestito solo nel codice, non dall'utente |

---

### SEZIONE 5 — TERZI E DPA

#### 5.1 Sub-processors identificati nel codice

| Terzo | Dati trasmessi | DPA | SCCs |
|-------|---------------|-----|------|
| **Google (GTM)** `GTM-KJXQXRXK` hardcoded in `app/layout.tsx` | IP, user agent, page visits di tutti gli utenti autenticati | ⚠️ SCONOSCIUTO | ⚠️ SCONOSCIUTO |
| **Google (Fonts)** — ✅ RISOLTO 2026-08-05 | Nessuno — font self-hosted, vedi nota sotto | N/A | N/A |
| **Google OAuth** | Email, nome, profilo Google utente | ⚠️ SCONOSCIUTO | ⚠️ SCONOSCIUTO |
| **Strava API** | Access token, activity data, profilo atleta | ⚠️ SCONOSCIUTO | ⚠️ SCONOSCIUTO |
| **Database hosting** (non visibile nel codice) | Tutti i dati | ⚠️ SCONOSCIUTO | ⚠️ SCONOSCIUTO |

> **Problema specifico su Google Fonts — RISOLTO:** Il CJEU ruling (Schrems II) e la sentenza del Tribunale di Monaco (2022) hanno stabilito che caricare Google Fonts direttamente da CDN Google è illegale perché trasferisce IP agli USA senza consenso.
>
> **Nota di correzione rispetto alla diagnosi originale:** `next/font/google` (usato per Geist) non era la fuga runtime — Next.js scarica quei font a build time e li serve già dal dominio dell'app. La fuga reale era l'`@import url("https://fonts.googleapis.com/css2?family=Inter...")` in `app/globals.css`, che faceva contattare `fonts.googleapis.com`/`fonts.gstatic.com` a ogni visitatore per caricare Inter (il vero font UI). Risolto vendorizzando i binari woff2 di Inter e Geist Mono in `lib/fonts/` e dichiarandoli via `next/font/local` (`lib/fonts/fonts.ts`) — zero richieste del browser verso domini Google, zero dipendenza da Google anche in fase di build.

#### 5.2 Trasferimenti verso Paesi Terzi

| Punto | Stato |
|-------|-------|
| Documento SCCs o Adequacy Decision per Google | ❌ NON DOCUMENTATO nel codebase |
| Register dei sub-processor | ❌ NON ESISTE |
| Transfer Impact Assessment | ❌ NON ESISTE |

---

### SEZIONE 6 — SECURITY & BREACH NOTIFICATION

#### 6.1 Misure di sicurezza

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| Password hashing | ✅ CONFORME | `better-auth` usa bcrypt di default con salt |
| SQL injection | ✅ CONFORME | Prisma ORM usa query parametrizzate |
| XSS | ✅ CONFORME | React escapa per default; `react-markdown` è safe. `dangerouslySetInnerHTML` usato solo per GTM script (necessario) |
| CSRF | ⚠️ PARZIALE | `better-auth` gestisce sessioni; no token CSRF esplicito visibile |
| Rate limiting | ❌ NON CONFORME | Nessun rate limiting su `/api/auth`, `/api/rpc`, `/api/strava/webhook` |
| WAF/DDoS protection | ⚠️ SCONOSCIUTO | Dipende dall'infrastruttura |
| Backup | ⚠️ SCONOSCIUTO | Non configurato nel codice |
| Secret management | ✅ CONFORME | Env variables; Docker compose commenta AWS Secrets Manager/HashiCorp Vault |
| Disable default credentials | ✅ CONFORME | Nessuna credential di default presente |

#### 6.2 Breach Detection

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| Logging strutturato eventi | ❌ NON CONFORME | Solo `console.error`; nessun log strutturato, nessun SIEM, nessun Sentry/Datadog |
| Log protetti | ❌ NON CONFORME | Console logs — accessibili a chiunque abbia accesso al server |
| Anomaly detection | ❌ NON CONFORME | Non implementato |

#### 6.3 Breach Notification

| Punto | Stato |
|-------|-------|
| Procedura documentata | ❌ NON ESISTE |
| Template notifica 72h al Garante | ❌ NON ESISTE |
| Contatti DPO / Legal designati | ❌ NON VISIBILE nel codice |

---

### SEZIONE 7 — PSEUDONYMIZATION

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| ID interni vs identificatori esterni | ✅ CONFORME | `User.id` (CUID interno) separato da `stravaId`, `email` |
| Token Strava pseudonimizzati/cifrati | ✅ CONFORME | **Aggiornamento 2026-08-03**: cifrati AES-256-GCM a livello di Prisma extension — vedi § 2.2 |
| Password hash salted | ✅ CONFORME | `better-auth` usa bcrypt con salt automatico |

---

### SEZIONE 8 — LOGGING & AUDIT TRAIL

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| Accesso a dati sensibili loggato | ❌ NON CONFORME | Nessun log di accesso strutturato |
| Modifiche ai dati loggate | ❌ NON CONFORME | `updatePolicyAcceptance` sovrascrive `privacyConsentTimestamp` — nessuna storia delle versioni precedenti |
| Consent history | ⚠️ PARZIALE | Timestamp dell'ultima accettazione presente, ma non storia completa (se l'utente ha accettato v1, poi v2, v3, rimane solo v3) |

---

### SEZIONE 9 — ENVIRONMENT VARIABLES

| Punto | Stato | Motivazione |
|-------|-------|-------------|
| Nessun secret hardcoded | ✅ CONFORME | Tutto via `process.env` |
| Env file separati per ambienti | ✅ CONFORME | `.env.local`, `.env.stg.local`, `.env.production.local` |
| Data residency configurata | ⚠️ SCONOSCIUTO | `DATABASE_URL` in env ma non documentato dove è hosted |

---

### SEZIONE 10 — DOCUMENTATION & RECORDS

| Punto | Stato |
|-------|-------|
| Records of Processing (Art. 30) | ❌ NON ESISTE nel repository |
| DPIA completata | ⚠️ SCONOSCIUTO |
| Privacy by Design | ⚠️ PARZIALE — rawJson purge è by design ma mai eseguito; consent tracking c'è; molto manca |

---

## 3. CRITICAL GAPS (ordine di priorità)

| # | Gap | Gravità | Azione |
|---|-----|---------|--------|
| 1 | ~~`purgeStaleActivityData()` non viene mai chiamata~~ | ✅ RISOLTO | Implementato `GET /api/cron/purge-raw-data` (Bearer `CRON_SECRET`) invocato ogni notte da `.github/workflows/purge-raw-data.yml`. Da verificare in staging con l'esecuzione reale del workflow |
| 2 | ~~**Nessun Right to Erasure** (Art. 17)~~ | ✅ RISOLTO | Implementato "Elimina account" nella tab utente, con conferma 2-step (digitare "ELIMINA"). Procedura oRPC `compliance.deleteAccount` (non un endpoint REST separato — segue il flusso oRPC + TanStack Query già usato nel progetto): revoca best-effort dell'autorizzazione Strava (`deauthorizeStrava` in `server/infrastructure/strava.client.ts`), poi `prisma.user.delete` (cascade Prisma fa il resto) |
| 3 | ~~**Nessun Data Export** (Art. 15 + Art. 20)~~ | ✅ RISOLTO | Implementato "Scarica i miei dati" nella tab utente. Procedura oRPC `compliance.exportUserData` (stesso flusso oRPC + TanStack Query, nessun endpoint REST dedicato) aggrega `User`, consensi, account collegati (senza token), `Activity` (incluso `rawJson`), `GearFunctional`, `GearDevice`, `UserStatistics` in un JSON scaricato lato browser |
| 4 | ~~**Token OAuth Strava in plaintext nel DB**~~ | ✅ RISOLTO | Cifrati AES-256-GCM (`ENCRYPTION_KEY`) via Prisma `$extends` (`lib/prisma-extensions/account-token-encryption.ts`), trasparente per tutti i call site incluso better-auth. Righe legacy in plaintext restano leggibili (passthrough) — nessun downtime; backfill idempotente in `scripts/encrypt-account-tokens.ts`. Rotazione/versioning della chiave non ancora implementati (follow-up) |
| 5 | ~~**Google Fonts caricati da CDN Google**~~ | ✅ RISOLTO | `@import` di Inter da `fonts.googleapis.com` rimosso da `app/globals.css`; Inter e Geist Mono ora self-hosted via `next/font/local` (`lib/fonts/fonts.ts`) |
| 6 | **Nessun Rate Limiting** | 🟠 ALTO | Aggiungere rate limiting su `/api/auth` (login, register, reset) con `@upstash/ratelimit` o middleware Next.js |
| 7 | **Consenso non granulare** — `averageHeartrate` è dato sanitario (Art. 9) | 🟠 ALTO | Aggiungere consenso esplicito separato per "dati biometrici/sanitari" prima di sincronizzare attività con HR |
| 8 | **GTM si carica su tutte le pagine autenticate** senza consenso utente | 🟠 ALTO | Implementare CMP (Consent Management Platform) lato utente; non caricare GTM finché l'utente non consente analytics |
| 9 | **Nessuna revoca del consenso** | 🟠 ALTO | Pagina "Privacy Dashboard" con toggle per revocare consenso; se revocato, bloccare elaborazione e avviare processo di cancellazione |
| 10 | **Nessun audit log** per accessi/modifiche dati sensibili | 🟡 MEDIO | Structured logging (Pino/Winston) con log di ogni chiamata a procedure che accedono a dati personali |
| 11 | **Nessun 2FA** | 🟡 MEDIO | Abilitare il plugin `twoFactor` di `better-auth` in `lib/auth.ts` |
| 12 | **Consenso history sovrascritta** | 🟡 MEDIO | Tabella `ConsentHistory` con foreign key su `User`, append-only, per ogni accettazione/revoca |
| 13 | **Nessun DPA register documentato** | 🟡 MEDIO | Creare documento interno con lista sub-processor, DPA firmati, SCCs per trasferimenti extra-EU |
| 14 | **Records of Processing (Art. 30) mancanti** | 🟡 MEDIO | Documento formale con finalità, base legale, categorie dati, retention per ogni trattamento |
| 15 | **Nessuna procedura breach notification** | 🟡 MEDIO | Procedura scritta: chi avvisare, template notifica Garante Privacy, latenza 72h |

---

## 4. RECOMMENDATION ROADMAP

### Settimana 1-2 (Gap critici — blockers legali)

1. ~~**Attivare il purge `rawJson`**~~ ✅ **FATTO**: endpoint `GET /api/cron/purge-raw-data` con `Authorization: Bearer CRON_SECRET`, chiamato ogni notte da `.github/workflows/purge-raw-data.yml` (GitHub Actions). Manca ancora la verifica dell'esecuzione reale in staging.

2. ~~**Delete Account**~~ ✅ **FATTO**: procedura oRPC `compliance.deleteAccount` (`prisma.user.delete` — Prisma cascade elimina tutto), con dialog di conferma a 2 step nella tab utente (`components/account/delete-account-dialog.tsx`).

3. ~~**Self-hosting Google Fonts**~~ ✅ **FATTO**: rimosso l'`@import` di Inter da `fonts.googleapis.com` in `app/globals.css`; Inter e Geist Mono ora vendorizzati e dichiarati via `next/font/local` in `lib/fonts/fonts.ts`. Nessuna richiesta browser/build verso domini Google per i font.

4. ~~**Data Export endpoint**~~ ✅ **FATTO**: procedura oRPC `compliance.exportUserData` — aggrega `User`, consensi, account collegati (senza token), `Activity[]` (incluso `rawJson`), `GearFunctional[]`, `GearDevice[]`, `UserStatistics[]` in un JSON scaricato dalla tab utente (`components/account/export-data-dialog.tsx`).

### Settimana 3-4 (Gap alti)

5. ~~**Cifrare token OAuth**~~ ✅ **FATTO**: `lib/encryption.ts` (AES-256-GCM) + Prisma `$extends` (`lib/prisma-extensions/account-token-encryption.ts`) cifra `accessToken`/`refreshToken`/`idToken` su write e decifra su read, trasparente per il client condiviso con better-auth. Backfill idempotente: `scripts/encrypt-account-tokens.ts`.

6. **Rate limiting**: aggiungere `middleware.ts` in root Next.js con rate limiting su `/api/auth/*` (max 10 req/min per IP) e `/api/rpc/*` (max 100 req/min per user).

7. **CMP utente per GTM**: aggiungere banner cookie consent che chiami `gtag('consent', 'update', {...})` in base alla scelta dell'utente; salvare preferenze in DB; non caricare script tracking senza consenso.

8. **Privacy Dashboard**: pagina `/settings/privacy` con: stato consenso corrente, toggle analytics, bottone "Scarica i miei dati", bottone "Elimina account".

### Mese 2 (Gap medi + audit interno)

9. **Consenso biometrico separato**: mostrare modal prima della prima sincronizzazione Strava che spiega la raccolta di `averageHeartrate` e richiede consenso esplicito separato.

10. **Structured logging**: sostituire `console.error` con Pino; aggiungere log di audit per `updatePolicyAcceptance`, `deleteUser`, `exportData`.

11. **Tabella `ConsentHistory`**: append-only, registra ogni cambio di consenso con `userId`, `documentId`, `documentVersion`, `action (accept|revoke)`, `timestamp`, `ipAddress`.

12. **Abilitare 2FA**: configurare plugin `twoFactor` in `lib/auth.ts`; rendere opzionale ma consigliato via UI.

13. **Records of Processing (Art. 30)**: documento interno con tutte le tipologie di trattamento.

14. **DPA register**: lista sub-processor con status DPA, SCCs, ultimo aggiornamento.

### Mese 3+ (Long-term + certification)

15. **DPIA formale**: per il trattamento di dati biometrici (HR, GPS, suffer score).

16. **Breach notification procedure**: SOP scritta, template notifica Garante, nominare un DPO o punto di contatto privacy.

17. **Penetration test**: specialmente su auth endpoints, webhook Strava (no autenticazione POST), data export endpoint.

18. **Backup e disaster recovery**: configurare backup automatici del DB con verifica periodica del restore.

19. **Audit di sicurezza**: review approfondita di `better-auth` configuration, CORS, headers HTTP (HSTS, CSP, etc.).

---

## 5. MISSING TECHNICAL CAPABILITIES

```
LIBRERIE DA AGGIUNGERE:
- node-cron / Vercel Cron Functions      → per eseguire purgeStaleActivityData()
- pino / pino-pretty                     → structured logging
- @upstash/ratelimit + @upstash/redis    → rate limiting stateless
- node:crypto (built-in)                 → AES-256-GCM per token encryption

FEATURES DA IMPLEMENTARE:
- DELETE /api/user/me                    → Right to Erasure
- GET /api/gdpr/export                   → Right of Access + Portability
- GET /api/cron/purge-raw-data           → eseguire purge 7gg rawJson
- /settings/privacy                      → Privacy Dashboard utente
- ConsentHistory table                   → audit trail consensi
- Cookie Consent banner                  → CMP per GTM
- Separato consenso biometrico           → prima sync Strava

INFRASTRUTTURA:
- ~~Self-host font Geist~~ ✅ FATTO         → Google Fonts CDN eliminato (`lib/fonts/fonts.ts`)
- Encryption at rest per token OAuth     → AES-256-GCM
- WAF / Cloudflare                       → rate limiting + DDoS
- Structured log aggregation             → Grafana Loki / Datadog

DOCUMENTAZIONE (non codice):
- Records of Processing (Art. 30)
- DPA register con sub-processor
- Breach notification SOP
- DPIA per dati biometrici
- Transfer Impact Assessment per Google/Strava (USA)
```

---

## 6. COMPLIANCE CHECKLIST FINALE (prima del lancio)

```
CONSENSO
[ ] Consenso granulare per dati biometrici (Art. 9)
[ ] Privacy Dashboard con toggle per tipo trattamento
[~] Flusso di revoca del consenso implementato — solo come "elimina account" (compliance.deleteAccount); manca una revoca parziale che non cancelli l'intero account
[ ] CMP per analytics/GTM con scelta utente
[ ] ConsentHistory table per audit trail

DIRITTI UTENTE
[x] Right to Erasure con conferma — procedura oRPC compliance.deleteAccount, UI in tab utente (non un endpoint REST separato)
[x] Right of Access + Portability (JSON) — procedura oRPC compliance.exportUserData, UI in tab utente
[ ] UI profilo per rettifica dati (nome, email)
[ ] Pagina /settings/privacy operativa

RETENTION
[x] purgeStaleActivityData() invocata da cron job ogni 24h
[ ] Cron verificato in staging che effettivamente nullifica rawJson
[ ] Policy di retention per tutti i dati documentata

SICUREZZA
[x] Token OAuth Strava cifrati (AES-256-GCM) — Prisma `$extends`, backfill in `scripts/encrypt-account-tokens.ts`
[x] Google Fonts self-hosted (rimuovere CDN)
[ ] Rate limiting su /api/auth/* e /api/rpc/*
[ ] 2FA abilitato (opzionale per utenti)
[ ] HTTP security headers (HSTS, CSP, X-Frame-Options)

TERZI & TRASFERIMENTI
[ ] DPA firmato e documentato per Google, Strava, hosting
[ ] SCCs verificate per trasferimenti USA
[ ] Sub-processor register creato e mantenuto

LOGGING
[ ] Structured logging per accessi a dati personali
[ ] Audit log per: login, accesso attività, export dati, delete account
[ ] Log aggregati e protetti (non accessibili agli utenti)

DOCUMENTAZIONE
[ ] Records of Processing (Art. 30) completato
[ ] DPIA per trattamento dati biometrici completata
[ ] Breach notification SOP scritta
[ ] Punto di contatto privacy/DPO designato
[ ] Privacy Policy aggiornata con tutti i sub-processor e retention
```
