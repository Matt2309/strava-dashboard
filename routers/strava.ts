import { os } from "@orpc/server";
import { z } from "zod";
import { errorHandlerMiddleware } from "@/routers/middlewares/error-handler";
import * as strava from "@/services";

export const getActivities = os
	.handler(async () => {
		return await strava.getActivities();
	})
	.use(errorHandlerMiddleware)
	.callable();

export const getActivity = os
	.input(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		return await strava.getActivity(input.id);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const exportToToon = os
	.input(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		return await strava.exportActivityToToon(input.id);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const stravaRouter = os.router({
	getActivities,
	getActivity,
	exportToToon,
});
