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
| ❌ NON CONFORME | Purge mai eseg0uito, nessun Right to Erasure UI, nessun data export, token OAuth in chiaro, nessun audit log, nessun 2FA, nessun DPA documentato, nessuna procedura breach | ~21 |

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
| Consenso granulare (analytics vs dati attività vs salute) | ✅ CONFORME | **Aggiornamento 2026-08-06**: aggiunto un consenso separato per i dati sanitari (Art. 9 GDPR — `averageHeartrate`, `sufferScore`), richiesto solo entrando nella sezione Garage (`components/garage/health-data-consent-gate.tsx`), prima che `getActivities()` possa innescare `runInitialSync()`. Rifiutare non blocca il Garage: attività, attrezzatura e statistiche restano sincronizzate, solo i due campi sanitari non vengono salvati né letti. Vedi § 3 gap #7 |
| Cosa succede se l'utente revoca | ⚠️ PARZIALE | Il flusso di revoca "elimina account" (`compliance.deleteAccount`) resta l'unico per la revoca *totale*. **Aggiornamento 2026-08-06**: esiste ora anche una revoca *parziale* per i soli dati sanitari, gestibile dalla pagina `/settings/privacy` (`compliance.setHealthDataConsent`) senza cancellare l'account — la revoca erase anche i dati già raccolti (`eraseHealthDataForUser`). Non esiste ancora un percorso di revoca granulare per altri trattamenti (es. analytics/GTM, vedi gap #8) |
| Consenso raccolto prima di qualunque elaborazione dati (incl. via API/webhook) | ⚠️ PARZIALE | Il gate legale vive nel layout `(user-app)`, quindi copre le pagine ma non le procedure oRPC né `/api/strava/webhook`. **Aggiornamento 2026-08-06**: per i dati sanitari questa falla è ora chiusa — `handleWebhookCreate` in `server/services/strava.service.ts` risolve il consenso (`getHealthDataConsent`) prima di persistere, e un utente che non ha ancora deciso (`healthDataConsent === null`) è trattato come non-consenziente. Resta invece invariato per il consenso legale generico (Privacy Policy/Termini): un'attività può ancora essere persistita via webhook per un utente che non ha attraversato il `LegalConsentWall` |

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
| Solo dati necessari | ⚠️ PARZIALE | `averageHeartrate` e `sufferScore` sono dati di categoria speciale (Art. 9 GDPR). **Correzione 2026-08-06 rispetto alla diagnosi originale**: `rawJson` non contiene l'intera risposta Strava API — `activitySchema` (`lib/types.ts`) è un oggetto Zod che strippa ogni chiave non dichiarata durante il parsing in `persistStravaActivity`, quindi `rawJson` contiene solo il sottoinsieme parsato (incluse le due chiavi sanitarie sopra, nessun GPS/potenza). La risposta grezza e non filtrata è invece esposta solo dall'export TOON (`getActivityToonExport`), letta live da Strava e non persistita |
| Documentazione su perché ogni campo sensibile è obbligatorio | ⚠️ PARZIALE | **Aggiornamento 2026-08-06**: `averageHeartrate`/`sufferScore` non sono più raccolti incondizionatamente — richiedono il consenso separato di § 3 gap #7 (risolto). Manca ancora una motivazione documentata di *perché* siano necessari per la funzionalità core, a prescindere dal consenso |
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
| Procedura di verifica cancellazione | ✅ CONFORME | **Aggiornamento 2026-08-06**: oltre al redirect a `/login` (verifica implicita lato utente), `deleteUserAccount` registra un evento `ACCOUNT_DELETED` in `AuditLog` prima della cancellazione, poi pseudonimizza (hash SHA-256) l'intera audit trail dell'utente — prova interna, verificabile a posteriori, che l'erasure è avvenuta e quando (Art. 5(2) accountability) |

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
| Art. 21 — Right to Object / opt-out per trattamento | ⚠️ PARZIALE | **Aggiornamento 2026-08-06**: opt-out granulare disponibile per i dati sanitari (HR/suffer score) da `/settings/privacy`. Nessuna UI per gestire preferenze analytics o opt-out dal trattamento GTM (resta gap #8) |

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
| Rate limiting | ✅ CONFORME | **Aggiornamento 2026-08-06**: `/api/auth` protetto dal rate limiter nativo di `better-auth`, ora esplicitamente `enabled: true` (non più dipendente da `NODE_ENV`) in `lib/auth.ts`, con regole dedicate su `/sign-in/email`, `/sign-up/email`, `/sign-in/social`, `/sign-in/oauth2` (5-10 req per finestra) e fallback 100 req/60s per il resto. `/api/rpc` protetto da un limiter dedicato in-memory (`lib/rate-limit.ts`, 500 req/min per sessione o IP) applicato in `app/api/rpc/[[...rest]]/route.ts`, perché fuori dal perimetro di better-auth ma punto di accesso a tutti i dati personali (export, delete account, attività). Storage volutamente in memoria (nessun IP persistito su DB) e nessuna nuova dipendenza esterna (scartato `@upstash/ratelimit` per non introdurre un ulteriore sub-processor USA da documentare). Entrambi gli store sono bounded: quello di `/api/rpc` (`lib/rate-limit.ts`) ha un tetto di 10.000 bucket con sweep delle entry scadute; per `/api/auth` è stato passato a better-auth un `rateLimit.customStorage` (stesso file, `authRateLimitStorage`) che sostituisce lo store `memory` nativo — quest'ultimo di default è una `Map` **senza alcun tetto**, che evince un'entry solo se la stessa chiave viene richiamata dopo la scadenza: un flood di chiavi mai riusate (es. IP falsificati) altrimenti crescerebbe indefinitamente in RAM. `/api/strava/webhook` resta non protetto — Strava non firma le richieste in modo verificabile lato codice, da valutare come follow-up separato. **Prerequisito infrastrutturale non verificabile da codice**: la risoluzione IP (`advanced.ipAddress.ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"]`) presume che il reverse proxy *sovrascriva* `X-Forwarded-For` con l'IP reale del client e che l'origin accetti traffico solo da Cloudflare — altrimenti l'header è falsificabile e il limite aggirabile. Da verificare in staging/produzione controllando che il log `"Rate limiting skipped: could not determine client IP address"` non compaia. |
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
| Accesso a dati sensibili loggato | ⚠️ PARZIALE | **Aggiornamento 2026-08-06**: introdotta la tabella `AuditLog` (append-only, `server/repositories/audit-log.repository.ts`), popolata per consensi (policy/termini/dati sanitari), diritti GDPR (`DATA_EXPORTED`, `ACCOUNT_DELETED`, `HEALTH_DATA_ERASED`) ed eventi di autenticazione (`USER_REGISTERED`, `LOGIN`, `LOGOUT` via `databaseHooks` in `lib/auth.ts`). Resta fuori scope l'accesso a singole attività (`getActivityDetail`/`getActivityToonExport`): volume alto, crescita illimitata, non tracciato per scelta esplicita |
| Modifiche ai dati loggate | ✅ CONFORME | **Aggiornamento 2026-08-06**: `recordLegalConsent` (accettazione policy/termini) e `setHealthDataConsent` scrivono la mutazione e il relativo evento di audit nella stessa transazione Prisma — un consenso registrato senza prova è considerato peggio di nessun consenso, quindi le due scritture vivono o muoiono insieme |
| Consent history | ✅ CONFORME | **Aggiornamento 2026-08-06**: risolto — `AuditLog` è append-only, quindi l'accettazione di v1, poi v2, poi v3 produce tre righe distinte con `metadata.version`, invece di sovrascrivere un unico timestamp su `User` |

**Scelte di design** (vedi `CLAUDE.md` § Audit trail per i dettagli implementativi):
- Nessun IP/user-agent registrato su alcuna riga — coerente con la posizione di data-minimization già presa in `lib/rate-limit.ts`
- Retention 24 mesi, purge automatico nel cron notturno esistente (`purgeStaleAuditLogs`, insieme a `purgeStaleActivityData`)
- Alla cancellazione account, `AuditLog` non viene cancellato a cascata (nessuna foreign key verso `User` per design) ma pseudonimizzato: `subjectId` sostituito da un hash SHA-256 dell'id originale, per conservare la prova dell'erasure (Art. 5(2) accountability) senza lasciare un identificativo direttamente attribuibile
- Ogni scrittura di audit non transazionale passa da `recordAuditEventSafe` (fail-safe): un fallimento nella scrittura del log non deve mai bloccare un login, un export o una cancellazione account

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
| 6 | ~~**Nessun Rate Limiting**~~ | ✅ RISOLTO | `/api/auth`: rate limiter nativo `better-auth` configurato esplicitamente in `lib/auth.ts` (regole dedicate su sign-in/sign-up/oauth2). `/api/rpc`: limiter dedicato in-memory (`lib/rate-limit.ts`) applicato nel route handler. Nessuna nuova dipendenza esterna |
| 7 | ~~**Consenso non granulare** — `averageHeartrate` è dato sanitario (Art. 9)~~ | ✅ RISOLTO | **Aggiornamento 2026-08-06**: consenso separato ed esplicito per i dati sanitari, richiesto solo nella sezione Garage (`components/garage/health-data-consent-gate.tsx`), prima di qualunque sync (`getActivities()` → `runInitialSync()`). Rifiutare non blocca il Garage (Art. 7(4)): attività/gear/statistiche restano, solo HR e suffer score non vengono salvati né letti. Enforcement completo lato server — `persistStravaActivity` (initial sync + webhook `create`), `getActivityDetail`, `getActivityToonExport` — non solo lato UI. Revocabile in qualunque momento da `/settings/privacy` (`compliance.setHealthDataConsent`), con cancellazione dei dati già raccolti (`eraseHealthDataForUser`). Nessun backfill retroattivo se il consenso viene concesso in un secondo momento (scelta deliberata, non un gap) |
| 8 | **GTM si carica su tutte le pagine autenticate** senza consenso utente | 🟠 ALTO | Implementare CMP (Consent Management Platform) lato utente; non caricare GTM finché l'utente non consente analytics |
| 9 | ~~**Nessuna revoca del consenso**~~ | ⚠️ PARZIALE | **Aggiornamento 2026-08-06**: aggiunta la pagina `/settings/privacy` con una revoca granulare per i dati sanitari (gap #7, risolto) — non richiede più di cancellare l'intero account per fermare quel trattamento. Manca ancora un toggle di revoca per gli analytics/GTM (gap #8, ancora aperto) |
| 10 | ~~**Nessun audit log** per accessi/modifiche dati sensibili~~ | ✅ RISOLTO | **Aggiornamento 2026-08-06**: tabella `AuditLog` append-only (`prisma/schema.prisma`), scritta da `server/repositories/audit-log.repository.ts` per consensi, diritti GDPR (export/delete/erasure sanitaria) ed eventi di autenticazione. Nessuna libreria esterna (Pino/Winston) introdotta — un DB append-only è più durevole e interrogabile di log stdout su Docker senza aggregazione, e resta comunque disponibile come follow-up per il logging operativo (non di compliance). Scritture non transazionali sempre fail-safe via `recordAuditEventSafe`. Deliberatamente escluso l'accesso a singole attività (volume alto, crescita illimitata) |
| 11 | **Nessun 2FA** | 🟡 MEDIO | Abilitare il plugin `twoFactor` di `better-auth` in `lib/auth.ts` |
| 12 | ~~**Consenso history sovrascritta**~~ | ✅ RISOLTO | **Aggiornamento 2026-08-06**: `recordLegalConsent` (`server/repositories/legal-consent.repository.ts`) e `setHealthDataConsent` (`server/repositories/user.repository.ts`) scrivono la mutazione su `User` e il relativo evento `AuditLog` (`POLICY_ACCEPTED`/`TERMS_ACCEPTED`/`HEALTH_DATA_CONSENT_GRANTED`/`HEALTH_DATA_CONSENT_REVOKED`) nella stessa transazione Prisma, con `metadata.version` del documento accettato. `AuditLog` non ha foreign key su `User` (per design, vedi gap #10) — è pseudonimizzato, non cancellato a cascata, alla cancellazione account |
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

6. ~~**Rate limiting**~~ ✅ **FATTO**: `/api/auth/*` protetto dal rate limiter nativo di `better-auth` (`lib/auth.ts`, regole dedicate per sign-in/sign-up/oauth2); `/api/rpc/*` protetto da un limiter dedicato in-memory (`lib/rate-limit.ts`, 500 req/min per sessione/IP) nel route handler — non un `middleware.ts` in root, per non intercettare anche le chiamate `.callable()` server-side che non hanno una `Request` HTTP.

7. **CMP utente per GTM**: aggiungere banner cookie consent che chiami `gtag('consent', 'update', {...})` in base alla scelta dell'utente; salvare preferenze in DB; non caricare script tracking senza consenso.

8. **Privacy Dashboard**: pagina `/settings/privacy` con: stato consenso corrente, toggle analytics, bottone "Scarica i miei dati", bottone "Elimina account".

### Mese 2 (Gap medi + audit interno)

9. ~~**Consenso biometrico separato**~~ ✅ **FATTO**: `components/garage/health-data-consent-gate.tsx`, vedi gap #7.

10. ~~**Structured logging / audit trail**~~ ✅ **FATTO**: tabella `AuditLog` append-only (`prisma/schema.prisma`) invece di Pino — vedi gap #10. Copre consensi (`recordLegalConsent`, `setHealthDataConsent`), diritti GDPR (`exportUserData` → `DATA_EXPORTED`, `deleteUserAccount` → `ACCOUNT_DELETED`, `setHealthDataConsentDecision` → `HEALTH_DATA_ERASED`) ed eventi di autenticazione (`databaseHooks` in `lib/auth.ts` → `USER_REGISTERED`/`LOGIN`/`LOGOUT`).

11. ~~**Tabella `ConsentHistory`**~~ ✅ **FATTO**: coperta dalla stessa tabella `AuditLog` invece di una tabella dedicata (`POLICY_ACCEPTED`/`TERMS_ACCEPTED` con `metadata.documentId`/`version`) — vedi gap #12. Nessun campo `ipAddress` per scelta di data-minimization (vedi § 8).

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
- ~~pino / pino-pretty~~                  → NON necessario: audit trail risolto con la tabella `AuditLog` (append-only, Postgres) invece di structured logging esterno — più durevole/interrogabile di log stdout, nessuna nuova dipendenza
- ~~@upstash/ratelimit + @upstash/redis~~  → NON necessario: rate limiting risolto con il limiter nativo di better-auth (`/api/auth`) + un limiter in-memory custom (`/api/rpc`, `lib/rate-limit.ts`), evitando un sub-processor USA aggiuntivo
- node:crypto (built-in)                 → AES-256-GCM per token encryption; SHA-256 per la pseudonimizzazione di AuditLog

FEATURES DA IMPLEMENTARE:
- DELETE /api/user/me                    → Right to Erasure
- GET /api/gdpr/export                   → Right of Access + Portability
- GET /api/cron/purge-raw-data           → eseguire purge 7gg rawJson
- /settings/privacy                      → Privacy Dashboard utente
- ~~ConsentHistory table~~ ✅ FATTO       → coperta da `AuditLog` (vedi gap #10/#12)
- Cookie Consent banner                  → CMP per GTM
- ~~Separato consenso biometrico~~ ✅ FATTO → prima sync Strava (health-data-consent-gate)

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
[x] Consenso granulare per dati biometrici (Art. 9) — health-data-consent-gate nel Garage, revoca da /settings/privacy, erasure dei dati già raccolti su rifiuto/revoca
[~] Privacy Dashboard con toggle per tipo trattamento — /settings/privacy esiste con il toggle per i dati sanitari; manca ancora il toggle analytics/GTM
[x] Flusso di revoca del consenso implementato — "elimina account" (compliance.deleteAccount) per la revoca totale; compliance.setHealthDataConsent per la revoca parziale dei dati sanitari senza cancellare l'account
[ ] CMP per analytics/GTM con scelta utente
[x] ConsentHistory per audit trail — coperta dalla tabella AuditLog (POLICY_ACCEPTED/TERMS_ACCEPTED/HEALTH_DATA_CONSENT_*), append-only, scritta in transazione con la mutazione del consenso

DIRITTI UTENTE
[x] Right to Erasure con conferma — procedura oRPC compliance.deleteAccount, UI in tab utente (non un endpoint REST separato)
[x] Right of Access + Portability (JSON) — procedura oRPC compliance.exportUserData, UI in tab utente
[ ] UI profilo per rettifica dati (nome, email)
[x] Pagina /settings/privacy operativa — consenso dati sanitari, link ai documenti legali, export/delete account

RETENTION
[x] purgeStaleActivityData() invocata da cron job ogni 24h
[ ] Cron verificato in staging che effettivamente nullifica rawJson
[ ] Policy di retention per tutti i dati documentata

SICUREZZA
[x] Token OAuth Strava cifrati (AES-256-GCM) — Prisma `$extends`, backfill in `scripts/encrypt-account-tokens.ts`
[x] Google Fonts self-hosted (rimuovere CDN)
[x] Rate limiting su /api/auth/* (better-auth) e /api/rpc/* (lib/rate-limit.ts) — /api/strava/webhook resta escluso, da valutare come follow-up
[ ] 2FA abilitato (opzionale per utenti)
[ ] HTTP security headers (HSTS, CSP, X-Frame-Options)

TERZI & TRASFERIMENTI
[ ] DPA firmato e documentato per Google, Strava, hosting
[ ] SCCs verificate per trasferimenti USA
[ ] Sub-processor register creato e mantenuto

LOGGING
[x] Audit trail per accessi/modifiche a dati sensibili — tabella AuditLog append-only (no IP/user-agent, retention 24 mesi con purge automatico); NON structured logging esterno (Pino), scelta deliberata: DB durevole/interrogabile invece di log stdout
[x] Audit log per: login, logout, registrazione (databaseHooks in lib/auth.ts), export dati, delete account, consensi — esclude deliberatamente l'accesso a singole attività (volume alto, non tracciato)
[x] Log protetti — tabella DB non esposta da nessuna procedura oRPC lato utente, nessun endpoint di lettura pubblico

DOCUMENTAZIONE
[ ] Records of Processing (Art. 30) completato
[ ] DPIA per trattamento dati biometrici completata
[ ] Breach notification SOP scritta
[ ] Punto di contatto privacy/DPO designato
[ ] Privacy Policy aggiornata con tutti i sub-processor e retention
```
