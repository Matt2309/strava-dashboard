import { os } from "@orpc/server";
import { stravaRouter } from "@/routers/strava";

export const appRouter = os.router({
	strava: stravaRouter,
});

export type AppRouter = typeof appRouter;

export default appRouter;
