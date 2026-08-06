import { os } from "@orpc/server";
import { complianceRouter } from "@/routers/compliance";
import { securityRouter } from "@/routers/security";
import { stravaRouter } from "@/routers/strava";

export const appRouter = os.router({
	strava: stravaRouter,
	compliance: complianceRouter,
	security: securityRouter,
});

export type AppRouter = typeof appRouter;

export default appRouter;
