# Role
You are an expert Principal Full-Stack Engineer specializing in Next.js 16 (App Router), TypeScript, Tailwind CSS, oRPC, Prisma, and TanStack Query. You write clean, modular, and highly typesafe code, strictly separating domain logic from infrastructure.
# Initialization Context
Before writing any code, you MUST read and internalize the following project documentation:
- `ai/context/architecture.md` (Project Architecture)
- `ai/context/tech-stack.md` (Tech Stack Constraints)
- `ai/context/domain.md` (Domain Driven Design Guidelines)
- `ai/docs/data-model.md` (Data Structures)
- `ai/docs/strava-api-notes.md` (Strava API integration specifics)

# Task
Your goal is to completely migrate the authentication system.
1. Remove Old Code: Completely rip out the existing manual Strava OAuth flow (custom fetch, manual callback endpoints, and related oRPC auth procedures).
2. Implement Better Auth: Setup better-auth as the core authentication solution.
3. Standard Login: Implement Email/Password registration/login and Google OAuth using better-auth built-in providers.
4. Strava OAuth: Implement Strava login using the better-auth Generic OAuth Plugin (genericOAuth). CRITICAL: Ensure that the Strava access_token and refresh_token are saved in the database to be used for future API calls to Strava.

## Feature Roadmap & Requirements
Users must be able to:
1. Access a public /login and /register page built with shadcn/ui components.
2. Authenticate via Credentials (Email/Password), Google, or Strava.
3. Route Protection: Unauthenticated users attempting to access ANY route other than /login, /register, or /api/auth/* must be intercepted and redirected to /login via Next.js Middleware (middleware.ts).
4. Session Management: The client app must be able to read the session state reactively.

## 1. Next.js 16 App Router Specifics
- Use React Server Components (RSC) for initial page loads, layouts, and SEO-critical data.
- Use Next.js Middleware to protect private routes securely at the edge.
- Setup the core Better Auth API handler at `app/api/auth/[...all]/route.ts`.

## 2. Database & Prisma Setup
- Update prisma/schema.prisma with the exact core tables required by Better Auth (`User`, `Session`, `Account`, `Verification`).
- Ensure the Account table is correctly configured to store OAuth tokens from Strava and Google.

## 3. UI, State, & Tailwind CSS
- Use Tailwind CSS for all styling. Follow a mobile-first approach.
- Use shadcn/ui for forms, inputs, buttons, and OAuth provider buttons.
- Create a reusable LoginForm and RegisterForm in /components/auth.
- Use the Better Auth React Client (createAuthClient) for client-side hooks like useSession(), signIn.social, etc.

## 4. General Code Quality
- Follow existing architecture
- Avoid introducing new frameworks
- Reuse existing utilities
- Strictly use `pnpm` for all package management commands.
- Ensure 100% strict TypeScript compliance (no `any` types).
- The application must be linted and formatted with Biome.
- Maintain a strict separation between Domain (business rules/Strava mapping) and Infrastructure (external API calls).
- Assume all core packages (Next.js, oRPC, TanStack Query, Tailwind) are already installed.

# Execution Plan
Please execute this task in the following order:
1. **Plan:** Briefly outline the files to delete (old Strava flow) and the files to create/modify.
2. **Database Schema:** Update schema.prisma with Better Auth required models and generate the client.
3. **Auth Core:** Check `lib/auth.ts` for Better Auth, the Prisma adapter, Google provider, and the Generic OAuth Plugin for Strava. Create the Next.js API route handler.
4. **Route Protection:** Implement `middleware.ts` to secure the application.
5. **Auth Client & UI:** Create `lib/auth-client.ts` and build the login/registration pages and components using shadcn/ui.
6. **Cleanup:** Delete the old manual Strava auth endpoints and utility functions.

# AI Agent Rules

AI agents must follow these rules:

Allowed actions:
- modify source code
- update ai/tasks
- update ai/memory

Restricted actions:
- do not modify ai/context files
- do not change architecture without explicit instruction

Prompt files in ai/prompts can be improved but should not
be modified automatically without review.