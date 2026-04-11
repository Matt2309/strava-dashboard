import { z } from "zod";

// ===== PLAN SCHEMAS (Building a workout plan) =====

export const createPlanSchema = z.object({
	name: z.string().min(1, "Plan name required"),
	type: z.string().min(1, "Plan type required"),
	expiryDate: z.date().nullable().optional(),
	days: z.array(
		z.object({
			name: z.string().min(1, "Day name required"),
			order: z.number().int().min(1),
			notes: z.string().optional(),
			exercises: z.array(
				z.object({
					exerciseId: z.string().min(1, "Exercise required"),
					alternativeExerciseId: z.string().optional(),
					order: z.number().int().min(1),
					restTime: z.number().int().optional(),
					supersetId: z.string().optional(),
					supersetOrder: z.number().int().optional(),
					coachNotes: z.string().optional(),
					personalNotes: z.string().optional(),
					equipmentSetting1: z.string().optional(),
					equipmentSetting2: z.string().optional(),
					reps: z.array(
						z.object({
							setNumber: z.number().int().min(1),
							targetReps: z.string().optional(),
							targetRpe: z.number().optional(),
							weight: z.number().optional(),
							machineType: z.string().optional(),
						}),
					),
				}),
			),
		}),
	),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const getPlanDetailsSchema = z.object({
	planId: z.string().min(1),
});

export type GetPlanDetailsInput = z.infer<typeof getPlanDetailsSchema>;

// Plan response type
export const planResponseSchema = z.object({
	id: z.string(),
	userId: z.string(),
	name: z.string(),
	type: z.string(),
	expiryDate: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	days: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			order: z.number(),
			notes: z.string().nullable(),
			exercises: z.array(
				z.object({
					id: z.string(),
					exerciseId: z.string(),
					exercise: z.object({
						id: z.string(),
						nameEng: z.string(),
						nameIta: z.string().nullable(),
						photoUrl: z.string().nullable(),
					}),
					alternativeExerciseId: z.string().nullable(),
					alternativeExercise: z
						.object({
							id: z.string(),
							nameEng: z.string(),
							nameIta: z.string().nullable(),
						})
						.nullable(),
					order: z.number(),
					restTime: z.number().nullable(),
					supersetId: z.string().nullable(),
					supersetOrder: z.number().nullable(),
					coachNotes: z.string().nullable(),
					personalNotes: z.string().nullable(),
					equipmentSetting1: z.string().nullable(),
					equipmentSetting2: z.string().nullable(),
					reps: z.array(
						z.object({
							id: z.string(),
							setNumber: z.number(),
							targetReps: z.string().nullable(),
							targetRpe: z.number().nullable(),
							weight: z.number().nullable(),
							machineType: z.string().nullable(),
						}),
					),
				}),
			),
		}),
	),
});

export type PlanResponse = z.infer<typeof planResponseSchema>;

// ===== WORKOUT SESSION SCHEMAS (Logging actual performance) =====

export const startWorkoutSchema = z.object({
	dayId: z.string().min(1),
});

export type StartWorkoutInput = z.infer<typeof startWorkoutSchema>;

export const completeSetSchema = z.object({
	sessionId: z.string().min(1),
	sessionExerciseId: z.string().min(1),
	setNumber: z.number().int().min(1),
	reps: z.number().int().min(0),
	weight: z
		.number()
		.positive()
		.multipleOf(0.5, { message: "Weight must be in 0.5 increments" })
		.optional(),
	rpe: z
		.number()
		.min(1)
		.max(10)
		.multipleOf(0.5, { message: "RPE must be in 0.5 increments" })
		.optional(),
	machineType: z.string().optional(),
});

export type CompleteSetInput = z.infer<typeof completeSetSchema>;

export const swapExerciseSchema = z.object({
	sessionId: z.string().min(1),
	sessionExerciseId: z.string().min(1),
	alternativeExerciseId: z.string().min(1),
});

export type SwapExerciseInput = z.infer<typeof swapExerciseSchema>;

export const endWorkoutSchema = z.object({
	sessionId: z.string().min(1),
	sessionNotes: z.string().optional(),
});

export type EndWorkoutInput = z.infer<typeof endWorkoutSchema>;

// Workout session response
export const workoutSessionResponseSchema = z.object({
	id: z.string(),
	userId: z.string(),
	dayId: z.string().nullable(),
	startTime: z.date(),
	endTime: z.date().nullable(),
	sessionNotes: z.string().nullable(),
	exercises: z.array(
		z.object({
			id: z.string(),
			userExerciseId: z.string().nullable(),
			exerciseId: z.string(),
			exercise: z.object({
				id: z.string(),
				nameEng: z.string(),
				nameIta: z.string().nullable(),
				photoUrl: z.string().nullable(),
			}),
			order: z.number(),
			sets: z.array(
				z.object({
					id: z.string(),
					setNumber: z.number(),
					reps: z.number(),
					weight: z.number().nullable(),
					rpe: z.number().nullable(),
					machineType: z.string().nullable(),
				}),
			),
		}),
	),
});

export type WorkoutSessionResponse = z.infer<
	typeof workoutSessionResponseSchema
>;

// ===== EXERCISE SCHEMAS =====

export const exerciseResponseSchema = z.object({
	id: z.string(),
	nameEng: z.string(),
	nameIta: z.string().nullable(),
	photoUrl: z.string().nullable(),
	muscleGroupId: z.string(),
});

export type ExerciseResponse = z.infer<typeof exerciseResponseSchema>;

export const getExercisesSchema = z.object({
	muscleGroupId: z.string().optional(),
	search: z.string().optional(),
});

export type GetExercisesInput = z.infer<typeof getExercisesSchema>;
