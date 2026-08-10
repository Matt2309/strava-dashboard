import { prisma } from "@/lib/prisma";
import type {
	CompleteSetInput,
	EndWorkoutInput,
	SwapExerciseInput,
} from "@/lib/schemas/engine-room.schema";

type PlanExerciseData = Array<{
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
		photoUrl: string | null;
	} | null;
}>;

type SessionExerciseRow = {
	id: string;
	userExerciseId: string | null;
	exerciseId: string;
	exercise: {
		id: string;
		nameEng: string;
		nameIta: string | null;
		photoUrl: string | null;
	};
	sets: Array<{
		id: string;
		setNumber: number;
		reps: number;
		weight: number | null;
		rpe: number | null;
		machineType: string | null;
	}>;
};

/**
 * Joins the exercises actually created for a session with the plan rows they
 * came from, zipping by `userExerciseId` (NOT array index) — the DB order of
 * a resumed session's exercises isn't guaranteed to line up positionally
 * with `day.exercises`, so index-zipping would silently mismatch targets.
 */
function mapSessionExercises(
	sessionExercises: SessionExerciseRow[],
	planExercises: PlanExerciseData,
) {
	return sessionExercises
		.map((sessEx) => {
			const planEx = planExercises.find((p) => p.id === sessEx.userExerciseId);
			if (!planEx) return null;
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
				completedSets: sessEx.sets,
			};
		})
		.filter(
			(exercise): exercise is NonNullable<typeof exercise> => exercise !== null,
		);
}

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
				day: {
					select: {
						id: true,
						name: true,
						plan: { select: { id: true, name: true } },
					},
				},
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
								photoUrl: true,
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
		planExercises: PlanExerciseData,
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

		return mapSessionExercises(
			sessionExercises.map((sessEx) => ({ ...sessEx, sets: [] })),
			planExercises,
		);
	}

	/**
	 * Rebuilds the exercise view for a session that is already in progress
	 * (resumed workout), including the sets already logged for each exercise.
	 */
	buildResumedExercisesView(
		sessionExercises: SessionExerciseRow[],
		planExercises: PlanExerciseData,
	) {
		return mapSessionExercises(sessionExercises, planExercises);
	}

	async completeSet(data: CompleteSetInput) {
		return prisma.sessionSet.upsert({
			where: {
				sessionExerciseId_setNumber: {
					sessionExerciseId: data.sessionExerciseId,
					setNumber: data.setNumber,
				},
			},
			create: {
				sessionExerciseId: data.sessionExerciseId,
				setNumber: data.setNumber,
				reps: data.reps,
				weight: data.weight || null,
				rpe: data.rpe || null,
				machineType: data.machineType || null,
			},
			update: {
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
}

export const workoutSessionRepository = new WorkoutSessionRepository();
