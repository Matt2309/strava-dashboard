import type {
	CompleteSetInput,
	CreatePlanInput,
	EndWorkoutInput,
	SwapExerciseInput,
} from "@/lib/schemas/engine-room.schema";
import { exerciseRepository } from "@/server/repositories/exercise.repository";
import { workoutPlanRepository } from "@/server/repositories/workout-plan.repository";
import { workoutSessionRepository } from "@/server/repositories/workout-session.repository";

export class EngineRoomService {
	async getUserPlans(userId: string) {
		return workoutPlanRepository.getUserPlans(userId);
	}

	async getPlanDetails(planId: string, userId: string) {
		const plan = await workoutPlanRepository.getPlanWithDetails(planId, userId);
		if (!plan || plan.userId !== userId) {
			throw new Error("Plan not found or unauthorized");
		}
		return plan;
	}

	async createPlan(userId: string, data: CreatePlanInput) {
		return workoutPlanRepository.createPlan(userId, data);
	}

	async startWorkout(userId: string, dayId: string) {
		// Get the day with all exercises
		const day =
			await workoutSessionRepository.getWorkoutDayWithExercises(dayId);

		if (!day || day.plan.userId !== userId) {
			throw new Error("Day not found or unauthorized");
		}

		// Create workout session
		const session = await workoutSessionRepository.createSession(userId, dayId);

		// Initialize session exercises and get complete data
		const exercises = await workoutSessionRepository.initializeSessionExercises(
			session.id,
			day.exercises,
		);

		return {
			sessionId: session.id,
			dayId,
			exercises,
		};
	}

	async completeSet(userId: string, data: CompleteSetInput) {
		// Verify session belongs to user
		const session = await workoutSessionRepository.getSessionWithExercises(
			data.sessionId,
		);
		if (!session || session.userId !== userId) {
			throw new Error("Session not found or unauthorized");
		}

		return workoutSessionRepository.completeSet(data);
	}

	async swapExercise(userId: string, data: SwapExerciseInput) {
		// Verify session belongs to user
		const session = await workoutSessionRepository.getSessionWithExercises(
			data.sessionId,
		);
		if (!session || session.userId !== userId) {
			throw new Error("Session not found or unauthorized");
		}

		return workoutSessionRepository.swapExercise(data);
	}

	async endWorkout(userId: string, data: EndWorkoutInput) {
		// Verify session belongs to user
		const session = await workoutSessionRepository.getSessionWithExercises(
			data.sessionId,
		);
		if (!session || session.userId !== userId) {
			throw new Error("Session not found or unauthorized");
		}

		return workoutSessionRepository.endWorkout(data);
	}

	async getExercises(search?: string, muscleGroupId?: string) {
		return exerciseRepository.getExercises(search, muscleGroupId);
	}

	async getMuscleGroups() {
		return exerciseRepository.getMuscleGroups();
	}
}

export const engineRoomService = new EngineRoomService();
