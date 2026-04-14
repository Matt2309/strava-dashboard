import { os } from "@orpc/server";
import { engineRoomRouter } from "@/routers/engine-room";
import { stravaRouter } from "@/routers/strava";

export const appRouter = os.router({
	strava: stravaRouter,
	engineRoom: engineRoomRouter,
});

export type AppRouter = typeof appRouter;

export default appRouter;
