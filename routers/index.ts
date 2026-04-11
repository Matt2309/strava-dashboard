import { os } from "@orpc/server";
import { stravaRouter } from "@/routers/strava";
import { engineRoomRouter } from "@/routers/engine-room";

export const appRouter = os.router({
	strava: stravaRouter,
	engineRoom: engineRoomRouter,
});

export type AppRouter = typeof appRouter;

export default appRouter;
