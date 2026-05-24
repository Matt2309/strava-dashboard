import { os } from "@orpc/server";
import { stravaRouter } from "@/routers/strava";
import {complianceRouter} from "@/routers/compliance";

export const appRouter = os.router({
	strava: stravaRouter,
    compliance: complianceRouter
});

export type AppRouter = typeof appRouter;

export default appRouter;
