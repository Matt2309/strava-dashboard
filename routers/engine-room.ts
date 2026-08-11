import { os } from "@orpc/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
	completeSetSchema,
	createPlanSchema,
	deletePlanSchema,
	endWorkoutSchema,
	getExercisesSchema,
	getSessionSchema,
	getWorkoutDaySchema,
	swapExerciseSchema,
	updatePlanSchema,
} from "@/lib/schemas/engine-room.schema";
import { errorHandlerMiddleware } from "@/routers/middlewares/error-handler";
import { engineRoomService } from "@/server/services/engine-room.service";

async function getUserIdFromSession(): Promise<string> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		throw new Error("Unauthorized: No active session");
	}
	return session.user.id;
}

export const getPlans = os
	.handler(async () => {
		const userId = await getUserIdFromSession();
		return await engineRoomService.getUserPlans(userId);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const getPlanDetails = os
	.input(z.object({ planId: z.string().min(1) }))
	.handler(async ({ input }) => {
		const userId = await getUserIdFromSession();
		return await engineRoomService.getPlanDetails(input.planId, userId);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const createPlan = os
	.input(createPlanSchema)
	.handler(async ({ input }) => {
		const userId = await getUserIdFromSession();
		return await engineRoomService.createPlan(userId, input);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const updatePlan = os
	.input(updatePlanSchema)
	.handler(async ({ input }) => {
		const userId = await getUserIdFromSession();
		return await engineRoomService.updatePlan(userId, input);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const deletePlan = os
	.input(deletePlanSchema)
	.handler(async ({ input }) => {
		const userId = await getUserIdFromSession();
		return await engineRoomService.deletePlan(userId, input.planId);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const getWorkoutDay = os
	.input(getWorkoutDaySchema)
	.handler(async ({ input }) => {
		const userId = await getUserIdFromSession();
		return await engineRoomService.getWorkoutDay(userId, input.dayId);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const startWorkout = os
	.input(z.object({ dayId: z.string().min(1) }))
	.handler(async ({ input }) => {
		const userId = await getUserIdFromSession();
		return await engineRoomService.startWorkout(userId, input.dayId);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const completeSet = os
	.input(completeSetSchema)
	.handler(async ({ input }) => {
		const userId = await getUserIdFromSession();
		await engineRoomService.completeSet(userId, input);
		return { success: true };
	})
	.use(errorHandlerMiddleware)
	.callable();

export const swapExercise = os
	.input(swapExerciseSchema)
	.handler(async ({ input }) => {
		const userId = await getUserIdFromSession();
		await engineRoomService.swapExercise(userId, input);
		return { success: true };
	})
	.use(errorHandlerMiddleware)
	.callable();

export const endWorkout = os
	.input(endWorkoutSchema)
	.handler(async ({ input }) => {
		const userId = await getUserIdFromSession();
		await engineRoomService.endWorkout(userId, input);
		return { success: true };
	})
	.use(errorHandlerMiddleware)
	.callable();

export const getExercises = os
	.input(getExercisesSchema)
	.handler(async ({ input }) => {
		await getUserIdFromSession();
		return await engineRoomService.getExercises(
			input.search,
			input.muscleGroupId,
		);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const getMuscleGroups = os
	.handler(async () => {
		await getUserIdFromSession();
		return await engineRoomService.getMuscleGroups();
	})
	.use(errorHandlerMiddleware)
	.callable();

export const getSession = os
	.input(getSessionSchema)
	.handler(async ({ input }) => {
		const userId = await getUserIdFromSession();
		return await engineRoomService.getSessionSummary(userId, input.sessionId);
	})
	.use(errorHandlerMiddleware)
	.callable();

export const engineRoomRouter = os.router({
	getPlans,
	getPlanDetails,
	createPlan,
	updatePlan,
	deletePlan,
	getWorkoutDay,
	startWorkout,
	completeSet,
	swapExercise,
	endWorkout,
	getExercises,
	getMuscleGroups,
	getSession,
});
