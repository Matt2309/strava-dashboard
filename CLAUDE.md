# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm docker:dev          # Start dev environment with Docker (recommended)
pnpm dev                 # Run Next.js dev server directly (requires local Postgres)

# Build
pnpm build
pnpm start

# Linting & formatting (Biome, not ESLint/Prettier)
pnpm biome:lint          # Check linting
pnpm biome:lint:fix      # Fix linting issues
pnpm biome:format:fix    # Auto-format files

# Database (uses dotenv-cli with .env.local)
pnpm db:generate         # Regenerate Prisma client after schema changes
pnpm db:migrate:dev      # Create and apply a new migration
pnpm db:migrate:deploy   # Apply pending migrations (CI/prod)
pnpm db:studio           # Open Prisma Studio
pnpm db:push             # Push schema without migration (prototyping only)

# Staging / production DB variants
pnpm stg-db:studio
pnpm prod-db:studio
```

No test suite is configured at this time.

## Architecture

**Dromos** is a Next.js 16 (App Router) application that syncs Strava activities, tracks athletic statistics, and manages gear ("garage"). The UI language is Italian.

### Layer overview

```
app/                     Next.js App Router — pages and API routes
routers/                 oRPC router definitions (thin: session check → service call)
server/
  infrastructure/        External API clients (Strava OAuth + REST)
  repositories/          All Prisma DB access
  services/              Business logic (strava.service.ts, compliance.service.ts)
lib/                     Shared: auth config, prisma client, query client, types, routes
hooks/                   React hooks (use-strava, use-compliance, use-mobile)
components/              UI components (shadcn/ui based)
prisma/schema.prisma     Single source of truth for the data model
```

### App Router route groups

| Group | Path | Access |
|-------|------|--------|
| `(app)/(auth)` | `/login`, `/register` | PROTECTED (redirect if logged in) |
| `(app)/(user-app)` | `/`, `/garage`, `/activity/:id` | PRIVATE (redirect if logged out) |
| `(app)/(legal)` | `/privacy-policy` | PUBLIC |

Route access levels (`RouteAccess.PUBLIC/PROTECTED/PRIVATE`) are defined in `lib/routes.ts` and enforced in the user-app layout at `app/(app)/(user-app)/layout.tsx`. That layout also gates rendering behind two sequential checks: privacy policy acceptance (`PolicyUpdateWall`), then Strava connection (`ConnectStrava`).

### API surface

- **`/api/auth/[...all]`** — better-auth handler (email/password, Google OAuth, Strava OAuth via `genericOAuth` plugin)
- **`/api/rpc/[[...rest]]`** — oRPC endpoint. All application data operations go through here. Routers are composed in `routers/index.ts` (`strava.*`, `compliance.*`).
- **`/api/strava/webhook`** — Strava push notifications (create / update / delete activity events)
- **`/api/cron/purge-raw-data`** — GDPR retention purge (`GET`, requires `Authorization: Bearer CRON_SECRET`). Runs `purgeStaleActivityData()` and `purgeStaleAuditLogs()`, invoked nightly by the `.github/workflows/purge-raw-data.yml` scheduled workflow.

oRPC procedures can be called directly from server components as plain async functions (bypassing HTTP), e.g. `await isStravaConnected({ userId })` in the layout.

**Rate limiting**: `/api/auth/*` is covered by better-auth's built-in rate limiter (configured in `lib/auth.ts` — `rateLimit` + `advanced.ipAddress`), using a bounded in-memory store (`authRateLimitStorage` in `lib/rate-limit.ts`) passed as `rateLimit.customStorage` instead of the default `"memory"` storage — the default has no cap and never evicts a key unless it's read again after expiry. `/api/rpc` sits outside that perimeter, so it has its own bounded limiter (`consumeRateLimit` in `lib/rate-limit.ts`) applied directly in `app/api/rpc/[[...rest]]/route.ts`, not as an oRPC middleware — a middleware would also fire on the server-side `.callable()` invocations above, which have no real client IP/session to key on. `/api/strava/webhook` and `/api/cron/purge-raw-data` are not rate-limited.

### Auth

`lib/auth.ts` — server-side better-auth instance. `lib/auth-client.ts` — client-side `createAuthClient` (use the exported `signIn`, `signUp`, `signOut`, `useSession` from there in client components).

Strava uses `genericOAuth` since it isn't a first-class better-auth provider. Account linking is enabled with `allowDifferentEmails: true` so a user can connect their Strava to an existing email account. Consent to the active `PrivacyPolicy`/`TermsConditions` is written only explicitly, via the `compliance` router (`acceptLegalDocuments`) — never stamped automatically on user creation, so an OAuth signup (Google/Strava) still has to go through the `LegalConsentWall` before it can use the app.

`lib/auth.ts` also registers `databaseHooks.user.create.after`, `databaseHooks.session.create.after`, and `databaseHooks.session.delete.before` to record `USER_REGISTERED`/`LOGIN`/`LOGOUT` audit events (see Audit trail below). All three call `recordAuditEventSafe`, so a failing audit write never blocks sign-up, sign-in, or sign-out.

### Database

PostgreSQL via `@prisma/adapter-pg`. Prisma client is generated to `lib/generated/prisma` (non-default path — always run `pnpm db:generate` after schema changes).

Key models: `User`, `Account`, `Session`, `Activity`, `GearFunctional`, `GearDevice`, `UserStatistics`, `PrivacyPolicy`, `AuditLog`.

**`UserStatistics.total_time_min`**: field name is misleading — the value is stored in **seconds**, not minutes.

`Activity.rawJson` stores the raw Strava API response and is nullified after 7 days for GDPR compliance (`isPurged` flag).

`GearFunctional` has a self-relation (`parent`/`children`) to link spike pins to their spiked shoe.

### Audit trail

`AuditLog` (GDPR audit gap #10/#12, `docs/gdpr-compliance-audit.md` § 3) is an append-only trail for consent changes, data-subject-rights operations (export/delete), and auth events (login/logout/registration). **It deliberately has no Prisma relation to `User`** — `subjectId` is a plain `String`, not a foreign key — so that `prisma.user.delete()` never has to cascade through it and a deleted user can never resurface via an `include`/`select` anywhere in the codebase. Do not add a relation here without re-reading that gap in the audit doc first.

- `server/repositories/audit-log.repository.ts` — `recordAuditEvent` (accepts an optional `tx` so the write can be atomic with a consent mutation), `pseudonymizeAuditSubject`, `getAuditLogForUser`, `purgeAuditLogsBefore`.
- `server/services/audit.service.ts` — `recordAuditEventSafe`/`pseudonymizeUserAuditTrail` wrap the repository calls in a try/catch that only logs on failure: an audit write must never block the operation it's recording (a login, an export, an account deletion).
- Consent mutations (`server/repositories/legal-consent.repository.ts#recordLegalConsent`, `server/repositories/user.repository.ts#setHealthDataConsent`) write the audit event in the *same* `$transaction` as the consent change — a consent recorded without proof is worse than no consent.
- Account deletion (`compliance.service.ts#deleteUserAccount`) records `ACCOUNT_DELETED` before deleting, then pseudonymizes that user's whole audit trail (SHA-256 hash of the old id) right after — the account is gone, but the fact that it was deleted, and when, remains provable.
- Purged nightly alongside `rawJson` by `/api/cron/purge-raw-data` (`purgeStaleAuditLogs`, 24-month retention — see `AUDIT_LOG_RETENTION_DAYS` in `compliance.service.ts`).
- No IP/user-agent is captured on any audit row, consistent with the data-minimization stance already taken in `lib/rate-limit.ts`.

### Data flow (Strava sync)

1. **Initial sync** (first time user lands on home): `getActivitiesForUser` detects zero rows → calls `runInitialSync` → seeds `UserStatistics` from athlete all-time totals, fetches last 30 activities, persists each with `persistStravaActivity`, syncs gear.
2. **Ongoing sync**: Strava webhooks hit `/api/strava/webhook` → `processWebhookEvent` → create/update/delete activity in DB + update `UserStatistics` atomically in a Prisma transaction.
3. **Statistics delta**: `persistStravaActivity` is idempotent; updates compute the diff between old and new values so `sessions_count` is never double-counted.

### Strava token handling

`server/infrastructure/strava.client.ts` — `fetchStravaForUser` refreshes the token automatically (with a 5-minute expiry buffer) before making any Strava API call.

`Account.accessToken`/`refreshToken`/`idToken` are encrypted at rest (AES-256-GCM, `ENCRYPTION_KEY`) via a Prisma `$extends` query extension (`lib/prisma-extensions/account-token-encryption.ts`) applied to the client exported from `lib/prisma.ts` — encryption/decryption is transparent to every call site, including better-auth's own reads/writes (it uses the same client). Legacy plaintext rows (no `enc:v1:` prefix) are read through unchanged, so this required no downtime migration; `scripts/encrypt-account-tokens.ts` (`pnpm db:encrypt-tokens` / `stg-db:encrypt-tokens` / `prod-db:encrypt-tokens`) is an idempotent backfill for pre-existing rows.

### oRPC + TanStack Query

Client-side queries use `@orpc/tanstack-query`. The query client is configured in `lib/query.ts` (`staleTime: 0`, `gcTime: 5 min`, max 1 retry).

### Environment files

| File | Used for |
|------|----------|
| `.env.local` | Local development |
| `.env.stg.local` | Staging DB scripts |
| `.env.production.local` | Production Docker build and DB scripts |

Required variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_WEBHOOK_VERIFY_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CRON_SECRET`, `ENCRYPTION_KEY`. See `.env.example`.
