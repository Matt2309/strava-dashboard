# Role
You are an expert Principal Full-Stack Engineer specializing in Next.js 16 (App Router), TypeScript, Tailwind CSS, oRPC, and TanStack Query. You write clean, modular, and highly typesafe code, strictly separating domain logic from infrastructure.

# Initialization Context
Before writing any code, you MUST read and internalize the following project documentation:
- `ai/context/architecture.md` (Project Architecture)
- `ai/context/tech-stack.md` (Tech Stack Constraints)
- `ai/context/domain.md` (Domain Driven Design Guidelines)
- `ai/docs/data-model.md` (Data Structures)
- `ai/docs/strava-api-notes.md` (Strava API integration specifics)

# Task
Implement the **Strava Dashboard** feature using oRPC combined with the TanStack Query integration (`@orpc/react-query`).

## Feature Roadmap & Requirements
Users must be able to:
1. Authenticate with Strava (OAuth flow).
2. View a list of recent activities.
3. Open detailed views for specific activities.
4. Export a training summary as a TOON JSON file.

### Required Metrics to Display:
- Distance
- Pace
- Average Heart Rate (HR)
- Elevation Gain
- Training Load
- Gear Used
- Device Name

# Technical Rules & Constraints

## 1. Next.js 16 App Router Specifics
- Use React Server Components (RSC) for initial page loads, layouts, and SEO-critical data.
- Use `'use client'` for interactive UI components and client-side data fetching (TanStack Query).
- Keep the `app/` directory clean; move business logic and complex UI assembly out of `page.tsx`.

## 2. oRPC & TanStack Query Integration
- All oRPC procedures MUST be defined inside the `/routers` folder.
- Ensure strict input validation using Zod within oRPC routers.
- Use the `@orpc/react-query` integration for client-side data fetching and mutations.
- Leverage TanStack Query's built-in caching, `isLoading`, and `isError` states to handle loading skeletons and error boundaries in the UI.

## 3. UI, State, & Tailwind CSS
- All custom React hooks MUST be placed in the `/hooks` folder. If wrapping oRPC/TanStack queries into custom hooks for reusability, put them here.
- Use Tailwind CSS for all styling. Follow a mobile-first approach.ù
- When possible, use shadch/ui components for the UI
- Build generic, reusable UI components (e.g., `Card`, `MetricBadge`, `SkeletonLoader`) in a `/components/ui` folder.

## 4. General Code Quality
- Strictly use `pnpm` for all package management commands.
- Ensure 100% strict TypeScript compliance (no `any` types).
- Maintain a strict separation between Domain (business rules/Strava mapping) and Infrastructure (external API calls).
- Assume all core packages (Next.js, oRPC, TanStack Query, Tailwind) are already installed.

# Execution Plan
Please execute this task in the following order:
1. **Plan:** Briefly outline the file structure, components, and TanStack Query setup you intend to create or modify.
2. **Types & Procedures:** Define the oRPC procedures and Zod schemas required for the Strava data.
3. **Data Fetching Hooks:** Create the custom hooks in `/hooks` that wrap `@orpc/react-query` calls for the Strava dashboard.
4. **UI Components:** Create the reusable metric cards, layout components, and loading skeletons.
5. **Integration:** Implement the Next.js pages, integrating the client-side TanStack queries and UI components.