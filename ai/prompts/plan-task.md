# Role
You are an expert Principal Full-Stack Engineer specializing in Next.js 16 (App Router), TypeScript, Tailwind CSS, oRPC, Prisma, and TanStack Query. You write clean, modular, and highly typesafe code, strictly separating domain logic from infrastructure.

# Initialization Context
Before writing any code, you MUST read and internalize the following project documentation:

- `ai/context/architecture.md` (Project Architecture)
- `ai/context/tech-stack.md` (Tech Stack Constraints)
- `ai/context/domain.md` (Domain Driven Design Guidelines)
- `ai/docs/data-model.md` (Data Structures)
- `ai/docs/strava-api-notes.md` (Strava API integration specifics)
- Analyze the actual flow (manual Strava api call flow)

# Task
Your goal is to implement the Strava Webhook synchronization for reducing the polling to Strava, the materialized statistics aggregation (user_statistics), and the initial data fetch flow for newly connected users.

1. Database Update: Add the Activity and UserStatistic models to Prisma.

2. Initial Connection Flow: Distinguish between a first-time Strava connection and a returning user. On first connection: fetch /athletes/{id}/stats to seed the UserStatistic table (historical baseline) and fetch the last 30 activities for the UI feed.

3. Webhook Handler: Implement the GET (verification) and POST (event handling) methods for the Strava Webhook. Handle create, update, and delete events to dynamically update both the Activity table and the UserStatistic table via Upsert logic.

4. Compliance Purge: Implement the logic to purge raw activity data after 7 days without altering the user's aggregated statistics.

# Channel
Submit a PR to the branch feature/garage

# Feature Roadmap & Requirements
Users must experience a seamless integration:

Frontend Consistency: The UI remains the same. The backend must orchestrate whether to trigger the heavy initial fetch or simply return the already synced data.

Statistics Aggregation: Maintain a user_statistics table with a composite unique key: [userId, sportType, terrainType]. When a webhook create event arrives, UPSERT this table (add distance, time, elevation, and update max records).

Webhook Setup: Ensure the app automatically registers its webhook URL with Strava if not already registered.

Data Compliance: Maintain an isPurged boolean on the Activity model. A separate service must be able to nullify raw GPS/JSON data for activities older than 7 days, strictly leaving the user_statistics untouched.

# 1. File Organization & Query Management (STRICT GUIDELINES)
You MUST adhere to a strict Layered Architecture to keep the Next.js 16 codebase clean:

- Route Handlers (app/api/...): Must ONLY handle HTTP request parsing, validation (Zod), and HTTP response formatting. ZERO business logic or Prisma calls here.
- Controllers/Procedures (server/api/routers/... oRPC): For client-to-server communication. Must call Services, not Prisma directly.
- Services (server/services/strava.ts): Contains all Domain/Business logic. This layer orchestrates the API calls to Strava and decides what data to pass to the Repositories.
- Repositories (server/repositories/activity.repository.ts, server/repositories/statistics.repository.ts): The ONLY places where prisma... is called. Queries must be modular, highly typed, and reusable.
- External API Clients (server/infrastructure/strava.client.ts): Must contain the fetch wrapper that intercepts expired tokens, checks Better-Auth's Account table, refreshes the token via Strava OAuth endpoint, updates the DB, and retries the original request.

# 2. Webhook Logic Specifics
Validation: Quickly respond 200 OK to Strava webhook POST requests to prevent timeout retries, processing the payload asynchronously (or immediately if serverless timeout allows, but keep it fast).

User Deletion: If aspect_type === "delete", fetch the local Activity. If it exists, SUBTRACT its metrics from UserStatistic, then delete the Activity row.

User Creation: If aspect_type === "create", fetch full details from Strava (using the Smart Token Wrapper), save to Activity, and UPSERT UserStatistic.

# 3. General Code Quality
Follow existing architecture.

Avoid introducing new frameworks.

Reuse existing utilities (especially for Better-Auth session checking).

Strictly use pnpm for all package management commands.

Ensure 100% strict TypeScript compliance (no any types).

Maintain a strict separation between Domain (business rules) and Infrastructure (external API calls).

# Execution Plan
Please execute this task in the following order:

1. Plan: Briefly outline the new files to be created across server/repositories, server/services, server/infrastructure, and app/api.
2. Infrastructure Layer: Use and modify if necessary strava.ts with the token refresh logic relying on Better-Auth's Account table.
3. Repository Layer: Create the Prisma abstraction files (activity.repository.ts, statistics.repository.ts). Implement the Upsert logic cleanly.
4. Service Layer: Implement into strava.ts connecting the client fetch, the initial sync logic, and the webhook payload processing.
5. API/Webhook Layer: Implement app/api/strava/webhook/route.ts (GET and POST).
6. Compliance: Create a utility function/script in server/services/compliance.service.ts for the 7-day purge logic.

# AI Agent Rules

AI agents must follow these rules:

Allowed actions:
- modify source code
- update ai/tasks
- update ai/memory

Restricted actions:
- do not modify ai/context files
- do not change architecture without explicit instruction

Prompt files in ai/prompts can be improved but should not be modified automatically without review.