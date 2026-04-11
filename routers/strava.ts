import { os } from "@orpc/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { errorHandlerMiddleware } from "@/routers/middlewares/error-handler";
import { findAllGearByUserId } from "@/server/repositories/gear.repository";
import {
	getActivitiesForUser,
	getActivityDetail,
	getActivityToonExport,
	isStravaConnected as isStravaConnectedServ,
	syncUserEquipment as syncUserEquipmentServ,
} from "@/server/services/strava.service";

/**
 * Helper to extract and validate the current user's ID from the session.
 */
async function getUserIdFromSession(): Promise<string> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		throw new Error("Unauthorized: No active session");
	}
	return session.user.id;
}

export const getActivities = os
	.handler(async () => {
		const userId = await getUserIdFromSession();
		return await getActivitiesForUser(userId);
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
		const userId = await getUserIdFromSession();
		return await getActivityDetail(userId, input.id);
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
		const userId = await getUserIdFromSession();
		return await getActivityToonExport(userId, input.id);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const isStravaConnected = os
	.handler(async () => {
		const userId = await getUserIdFromSession();
		return await isStravaConnectedServ(userId);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const syncUserEquipment = os
	.handler(async () => {
		const userId = await getUserIdFromSession();
		return await syncUserEquipmentServ(userId);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const getUserEquipment = os
	.handler(async () => {
		const userId = await getUserIdFromSession();
		return await findAllGearByUserId(userId);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const stravaRouter = os.router({
	getActivities,
	getActivity,
	exportToToon,
	isStravaConnected,
	syncUserEquipment,
	getUserEquipment,
});
