import { prisma } from "@/lib/prisma";
import type {
	CompleteSetInput,
	SwapExerciseInput,
	EndWorkoutInput,
} from "@/lib/schemas/engine-room.schema";

export class WorkoutSessionRepository {
	async createSession(userId: string, dayId: string) {
		return prisma.workoutSession.create({
			data: {
				userId,
				dayId,
				startTime: new Date(),
			},
		});
	}

	async getSessionWithExercises(sessionId: string) {
		return prisma.workoutSession.findUnique({
			where: { id: sessionId },
			include: {
				exercises: {
					orderBy: { order: "asc" },
					include: {
						exercise: {
							select: {
								id: true,
								nameEng: true,
								nameIta: true,
								photoUrl: true,
							},
						},
						sets: {
							orderBy: { setNumber: "asc" },
						},
					},
				},
			},
		});
	}

	async getWorkoutDayWithExercises(dayId: string) {
		return prisma.workoutDay.findUnique({
			where: { id: dayId },
			include: {
				plan: true,
				exercises: {
					orderBy: { order: "asc" },
					include: {
						exercise: {
							select: {
								id: true,
								nameEng: true,
								nameIta: true,
								photoUrl: true,
							},
						},
						alternativeExercise: {
							select: {
								id: true,
								nameEng: true,
								nameIta: true,
							},
						},
						reps: {
							orderBy: { setNumber: "asc" },
						},
					},
				},
			},
		});
	}

	async initializeSessionExercises(
		sessionId: string,
		planExercises: Array<{
			id: string;
			exerciseId: string;
			alternativeExerciseId: string | null;
			order: number;
			restTime: number | null;
			supersetId: string | null;
			supersetOrder: number | null;
			coachNotes: string | null;
			personalNotes: string | null;
			equipmentSetting1: string | null;
			equipmentSetting2: string | null;
			reps: Array<{
				setNumber: number;
				targetReps: string | null;
				targetRpe: number | null;
				weight: number | null;
				machineType: string | null;
			}>;
			exercise: {
				id: string;
				nameEng: string;
				nameIta: string | null;
				photoUrl: string | null;
			};
			alternativeExercise: {
				id: string;
				nameEng: string;
				nameIta: string | null;
			} | null;
		}>,
	) {
		const sessionExercises = await Promise.all(
			planExercises.map((planEx, idx) =>
				prisma.sessionExercise.create({
					data: {
						sessionId,
						userExerciseId: planEx.id,
						exerciseId: planEx.exerciseId,
						order: idx,
					},
					include: {
						exercise: {
							select: {
								id: true,
								nameEng: true,
								nameIta: true,
								photoUrl: true,
							},
						},
					},
				}),
			),
		);

		return sessionExercises.map((sessEx, idx) => {
			const planEx = planExercises[idx];
			return {
				sessionExerciseId: sessEx.id,
				userExerciseId: sessEx.userExerciseId,
				exerciseId: sessEx.exerciseId,
				exercise: sessEx.exercise,
				alternativeExerciseId: planEx.alternativeExerciseId,
				alternativeExercise: planEx.alternativeExercise,
				equipmentSetting1: planEx.equipmentSetting1,
				equipmentSetting2: planEx.equipmentSetting2,
				supersetId: planEx.supersetId,
				supersetOrder: planEx.supersetOrder,
				coachNotes: planEx.coachNotes,
				personalNotes: planEx.personalNotes,
				targetReps: planEx.reps,
			};
		});
	}

	async completeSet(data: CompleteSetInput) {
		return prisma.sessionSet.create({
			data: {
				sessionExerciseId: data.sessionExerciseId,
				setNumber: data.setNumber,
				reps: data.reps,
				weight: data.weight || null,
				rpe: data.rpe || null,
				machineType: data.machineType || null,
			},
		});
	}

	async swapExercise(data: SwapExerciseInput) {
		return prisma.sessionExercise.update({
			where: { id: data.sessionExerciseId },
			data: {
				exerciseId: data.alternativeExerciseId,
			},
		});
	}

	async endWorkout(data: EndWorkoutInput) {
		return prisma.workoutSession.update({
			where: { id: data.sessionId },
			data: {
				endTime: new Date(),
				sessionNotes: data.sessionNotes || null,
			},
		});
	}

	async getSessionForDay(userId: string, dayId: string) {
		return prisma.workoutSession.findFirst({
			where: {
				userId,
				dayId,
				endTime: null,
			},
			include: {
				exercises: {
					include: {
						sets: true,
					},
				},
			},
		});
	}
}

export const workoutSessionRepository = new WorkoutSessionRepository();
