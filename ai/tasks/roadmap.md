### Feature: Strava dashboard

# Role
You are an expert Principal Full-Stack Engineer specializing in Next.js 16 (App Router), TypeScript, Tailwind CSS, and oRPC. You write clean, modular, and highly typesafe code, strictly separating domain logic from infrastructure.

# Initialization Context
Before writing any code, you MUST read and internalize the following project documentation:
- `ai/context/architecture.md` (Project Architecture)
- `ai/context/tech-stack.md` (Tech Stack Constraints)
- `ai/context/domain.md` (Domain Driven Design Guidelines)
- `ai/docs/data-model.md` (Database/Data Structures)
- `ai/docs/strava-api-notes.md` (Strava API integration specifics)

# Task
Implement the **Strava Dashboard** feature.

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
- Default to React Server Components (RSC) for data fetching and layout.
- Use `'use client'` ONLY at the leaf nodes (interactive components like buttons, charts, or forms).
- When possible, for the UI use shadcn components
- Keep the `app/` directory clean; move business logic out of `page.tsx` and `layout.tsx`.

## 2. oRPC & Data Fetching
- All oRPC procedures MUST be defined inside the `/routers` folder.
- Ensure strict input validation using Zod (or your chosen schema validator) within oRPC routers.
- Keep handlers small; delegate complex logic to domain services.

## 3. UI, State, & Tailwind CSS
- All custom React hooks MUST be placed in the `/hooks` folder.
- Use Tailwind CSS for all styling. Follow a mobile-first approach.
- Build generic, reusable UI components (e.g., `Card`, `MetricBadge`) in a `/components/ui` folder before assembling the dashboard.

## 4. General Code Quality
- Strictly use `pnpm` for all package management commands.
- Ensure 100% strict TypeScript compliance (no `any` types).
- Maintain a strict separation between Domain (business rules) and Infrastructure (external APIs, DB).

# Execution Plan
Please execute this task in the following order:
1. **Plan:** Briefly outline the file structure and components you intend to create or modify.
2. **Types & Procedures:** Define the oRPC procedures and Zod schemas required for the Strava data.
3. **UI Components:** Create the reusable metric cards and layout components.
4. **Integration:** Implement the Next.js pages, integrating the oRPC hooks and UI components.