import type {
	CompleteSetInput,
	CreatePlanOutput,
	EndWorkoutInput,
	SwapExerciseInput,
	UpdatePlanOutput,
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

	async createPlan(userId: string, data: CreatePlanOutput) {
		return workoutPlanRepository.createPlan(userId, data);
	}

	async updatePlan(userId: string, data: UpdatePlanOutput) {
		// No pre-check here: ownership (and the day/exercise id-tampering
		// guard) is verified inside the repository's transaction, against the
		// same snapshot the diff is computed from. A pre-check here would just
		// be a TOCTOU window, not extra safety.
		return workoutPlanRepository.updatePlan(data.planId, userId, data);
	}

	async deletePlan(userId: string, planId: string) {
		const result = await workoutPlanRepository.deletePlan(planId, userId);
		// deleteMany silently reports count 0 for someone else's plan instead
		// of throwing; normalize that into the same error every other method
		// here throws on an ownership mismatch.
		if (result.count === 0) {
			throw new Error("Plan not found or unauthorized");
		}
		return { success: true };
	}

	async getWorkoutDay(userId: string, dayId: string) {
		const day =
			await workoutSessionRepository.getWorkoutDayWithExercises(dayId);
		if (!day || day.plan.userId !== userId) {
			throw new Error("Day not found or unauthorized");
		}

		const activeSession = await workoutSessionRepository.getSessionForDay(
			userId,
			dayId,
		);

		return {
			id: day.id,
			name: day.name,
			notes: day.notes,
			exercises: day.exercises,
			activeSessionId: activeSession?.id ?? null,
		};
	}

	async startWorkout(userId: string, dayId: string) {
		// Get the day with all exercises
		const day =
			await workoutSessionRepository.getWorkoutDayWithExercises(dayId);

		if (!day || day.plan.userId !== userId) {
			throw new Error("Day not found or unauthorized");
		}

		// Resume an already-open session for this day instead of starting a
		// second, parallel one.
		const existingSession = await workoutSessionRepository.getSessionForDay(
			userId,
			dayId,
		);

		if (existingSession) {
			const exercises = workoutSessionRepository.buildResumedExercisesView(
				existingSession.exercises,
				day.exercises,
			);

			return {
				sessionId: existingSession.id,
				dayId,
				exercises,
				resumed: true,
			};
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
			resumed: false,
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

	async getSessionSummary(userId: string, sessionId: string) {
		const session =
			await workoutSessionRepository.getSessionWithExercises(sessionId);
		if (!session || session.userId !== userId) {
			throw new Error("Session not found or unauthorized");
		}

		return session;
	}

	async getExercises(search?: string, muscleGroupId?: string) {
		return exerciseRepository.getExercises(search, muscleGroupId);
	}

	async getMuscleGroups() {
		return exerciseRepository.getMuscleGroups();
	}
}

export const engineRoomService = new EngineRoomService();
