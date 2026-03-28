# Copilot Instructions for Dromos

## Build, Test, and Lint Commands

### TypeScript Type Checking
```bash
npx tsc --noEmit
```

### Linting and Formatting (Biome)
```bash
pnpm biome:lint          # Check for linting issues
pnpm biome:lint:fix      # Auto-fix linting issues
pnpm biome:format        # Check formatting
pnpm biome:format:fix    # Auto-fix formatting
```

Biome is configured to auto-organize imports (`biome.json` has `organizeImports: "on"`).

### Database (Prisma)
```bash
pnpm db:generate         # Generate Prisma client
pnpm db:migrate:dev      # Create and apply migration (interactive)
pnpm db:migrate:deploy   # Apply pending migrations (non-interactive, for CI/prod)
pnpm db:push             # Sync schema without migrations (dev prototyping only)
pnpm db:studio           # Open Prisma Studio GUI
```

All database commands use `dotenv-cli` to load `.env.local`. For staging/prod, use `stg-db:*` or `prod-db:*` variants.

### Docker
```bash
pnpm docker:dev          # Start dev environment with auto-rebuild
pnpm docker:build        # Build production image
pnpm docker:prod         # Run production image locally
```

### Testing
**No tests currently exist in this codebase.** There is no testing framework configured.

---

## Architecture Overview

### Request Flow (oRPC Pattern)
```
UI → oRPC Router → Service → Repository → Prisma → Database
```

- **`routers/`** - oRPC API layer (RPC handler definitions)
  - Example: `routers/strava.ts` exports handlers like `getActivities`, `exportToToon`
  - Middleware: `routers/middlewares/error-handler.ts` catches and logs errors globally
  
- **`server/services/`** - Business logic layer
  - Example: `strava.service.ts` handles activity sync, webhooks, statistics calculation
  - Services call repositories for data access and infrastructure for external APIs
  
- **`server/repositories/`** - Database access layer
  - Example: `activity.repository.ts` provides CRUD operations for activities
  - All Prisma queries happen here
  
- **`server/infrastructure/`** - External integrations
  - Example: `strava.client.ts` handles Strava API auth and automatic token refresh

### oRPC Setup
- **Server**: `/routers/index.ts` combines all routers into `appRouter`
- **API Route**: `/app/api/rpc/[[...rest]]/route.ts` handles all oRPC requests
- **Client (browser)**: `/lib/orpc/client.ts` creates TanStack Query client with `/api/rpc` endpoint
- **Client (server)**: `/lib/orpc/server.ts` creates server-only router client for SSR

Handlers are defined using the oRPC builder pattern:
```typescript
export const getActivities = os
  .handler(async () => {
    const userId = await getUserIdFromSession();
    return await getActivitiesForUser(userId);
  })
  .use(errorHandlerMiddleware)
  .callable();
```

### Authentication (Better-Auth)
- **Provider**: Better-Auth with email/password + Google OAuth + Strava OAuth
- **Config**: `lib/auth.ts` (server), `lib/auth-client.ts` (client)
- **Session**: Stored in PostgreSQL via Prisma adapter
- **Strava OAuth**: Uses `genericOAuth` plugin with custom token handling
- **Token Storage**: Access/refresh tokens stored in `Account` table (`providerId="strava"`)
- **Token Refresh**: Automatic refresh handled in `server/infrastructure/strava.client.ts`

### Prisma Custom Setup
**⚠️ Important: Prisma client is NOT in `node_modules`**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"  // Custom output path
}
```

**Always import from the custom path:**
```typescript
import { PrismaClient } from "@/lib/generated/prisma/client";
```

**Singleton pattern** (`lib/prisma.ts`):
- Uses `@prisma/adapter-pg` for PostgreSQL connection pooling
- Cached in `globalThis` during development to prevent multiple instances

**Configuration** (`prisma.config.ts`):
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Uses `dotenv/config` for environment variables

---

## Key Conventions

### Strava API Calls
**Always use the centralized helper** (`server/infrastructure/strava.client.ts`):
```typescript
import { fetchStravaForUser } from "@/server/infrastructure/strava.client";

// Automatically handles token refresh if expired
const result = await fetchStravaForUser<ActivityData>(userId, "activities/123");
if (!result.ok || !result.data) {
  throw new StravaClientError(result.error || "Failed", result.statusCode);
}
```

**Never** make direct fetch calls to Strava API - the helper ensures:
- Fresh access tokens (auto-refresh if expired)
- Consistent error handling
- Proper authentication headers

### Error Handling Pattern
1. **Router Level**: `errorHandlerMiddleware` catches all errors, logs with status code
2. **Service Level**: Throw `StravaClientError` with `statusCode` for HTTP errors
3. **Validation**: Use Zod `.safeParse()` and throw 422 for invalid data

Example:
```typescript
const parsed = activitySchema.safeParse(data);
if (!parsed.success) {
  throw new StravaClientError("Invalid activity data from Strava API", 422);
}
```

### Environment Variables
All environment variables are **validated via Zod** in `lib/env.ts`:
```typescript
import { env } from "@/lib/env";
// Use env.STRAVA_CLIENT_ID, env.DATABASE_URL, etc.
```

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Min 32 chars
- `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` - App URL
- `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` - OAuth credentials
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials

### Database Workflow
- **Development**: Use `pnpm db:push` for quick schema prototyping (no migration files)
- **Production**: Always use `pnpm db:migrate:dev` → `pnpm db:migrate:deploy`
- **Multi-environment**: Database scripts support `.env.local`, `.env.stg.local`, `.env.production.local`

### Path Aliases
- `@/*` maps to project root
- Import example: `import { prisma } from "@/lib/prisma"`

### Import Organization
Biome automatically organizes imports on save (configured in `biome.json`).

---

## Important Files to Know

### Core Infrastructure
- **`lib/auth.ts`** - Better-Auth server configuration with Strava OAuth setup
- **`lib/auth-client.ts`** - Client-side auth hooks (`useSession`, `signIn`, `signOut`)
- **`lib/prisma.ts`** - Prisma singleton with pg adapter
- **`lib/env.ts`** - Environment variable validation with Zod
- **`lib/orpc/client.ts`** - Browser oRPC client with TanStack Query
- **`lib/orpc/server.ts`** - Server-side oRPC client for SSR

### Strava Integration
- **`server/infrastructure/strava.client.ts`** - Strava API client with auto token refresh
- **`server/services/strava.service.ts`** - Activity sync, webhook handling, statistics
- **`server/repositories/activity.repository.ts`** - Activity database operations
- **`routers/strava.ts`** - oRPC handlers for Strava endpoints

### Configuration
- **`prisma.config.ts`** - Prisma configuration (schema path, migrations)
- **`biome.json`** - Linting, formatting, and import organization
- **`next.config.ts`** - Next.js config (standalone output for Docker)
- **`.env.example`** - Template for required environment variables

### Docker
- **`docker/Dockerfile.prod`** - Multi-stage production build
- **`docker/compose.dev.yml`** - Development compose setup
- **`docker/compose.prod.yml`** - Production compose with resource limits

---

## Strava-Specific Patterns

### Activity Sync
1. **Initial sync** (on first Strava connection):
   - Fetch athlete stats: `GET /api/v3/athletes/{id}/stats`
   - Seed `UserStatistics` with all-time totals
   - Fetch last 30 activities: `GET /api/v3/athlete/activities?per_page=30`

2. **Ongoing sync** (webhook events):
   - Strava sends POST to `/api/strava/webhook` for create/update/delete
   - Events validated with Zod, processed asynchronously
   - Returns 200 immediately (don't block webhook)

### Sport Type Categorization
Activities are normalized into `{ sportName, terrainType }` pairs:
```typescript
// Example: "TrailRun" → { sportName: "running", terrainType: "trail" }
// See: server/services/strava.service.ts → categorizeSportType()
```

### Data Transformation
- **Strava API** uses `snake_case` (e.g., `start_date_local`)
- **Database** uses `camelCase` (Prisma convention)
- **UI** receives transformed data from oRPC handlers

### Token Refresh Flow
1. Check if `accessTokenExpiresAt > now()`
2. If expired, POST to `https://www.strava.com/oauth/token` with `refresh_token`
3. Update `Account` table with new tokens and expiry
4. Return fresh access token

All handled automatically in `fetchStravaForUser()`.

---

## Data Retention
- **Raw GPS/JSON data**: Purged after 7 days (compliance)
- **Statistics**: Aggregated metrics preserved indefinitely
- See: `server/services/compliance.service.ts`
