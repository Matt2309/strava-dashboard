# Strava Dashboard

This is a Next.js application that allows users to connect their Strava account, view their recent activities, and export them to a TOON JSON file.

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Strava Authentication:** Connect your Strava account using OAuth 2.0.
- **Activity List:** View a list of your recent activities.
- **Activity Details:** See detailed information about a specific activity.
- **Export to TOON:** Export an activity's data to a TOON JSON file.
- **Theme Toggle:** Switch between light and dark themes.
- **Loading Skeletons:** Provides a better loading experience for the user.
- **Error Boundary:** Handles errors gracefully to prevent the entire application from crashing.
- **Toast Notifications:** Provides feedback to the user when they perform an action.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [oRPC](https://orpc.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TypeScript](https://www.typescriptlang.org/)
