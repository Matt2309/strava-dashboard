import { z } from "zod";

// ===== SHARED SHAPES (create / update / form all build on these) =====

const planRepShape = {
	setNumber: z.coerce.number().int().min(1),
	targetReps: z.string().optional(),
	targetRpe: z.number().optional(),
	weight: z.number().optional(),
	machineType: z.string().optional(),
};

const planExerciseShape = {
	exerciseId: z.string().min(1, "Exercise required"),
	alternativeExerciseId: z.string().optional(),
	order: z.number().int().min(1),
	restTime: z.coerce.number().int().optional(),
	supersetId: z.string().optional(),
	supersetOrder: z.number().int().optional(),
	coachNotes: z.string().optional(),
	personalNotes: z.string().optional(),
	equipmentSetting1: z.string().optional(),
	equipmentSetting2: z.string().optional(),
};

const planDayShape = {
	name: z.string().min(1, "Day name required"),
	order: z.number().int().min(1),
	notes: z.string().optional(),
};

// ===== PLAN SCHEMAS (Building a workout plan) =====

export const createPlanSchema = z.object({
	name: z.string().min(1, "Plan name required"),
	type: z.string().min(1, "Plan type required"),
	durationWeeks: z.coerce
		.number()
		.int()
		.min(1, "Duration must be at least 1 week"),
	expiryDate: z.date().nullable().optional(),
	days: z.array(
		z.object({
			...planDayShape,
			exercises: z.array(
				z.object({
					...planExerciseShape,
					reps: z
						.array(z.object(planRepShape))
						.min(1, "At least one set required"),
				}),
			),
		}),
	),
});

export type CreatePlanInput = z.input<typeof createPlanSchema>;
export type CreatePlanOutput = z.infer<typeof createPlanSchema>;

// ===== UPDATE / DELETE PLAN SCHEMAS =====
// `id` on a day/exercise is present => that row already exists and must be
// UPDATEd in place (preserves WorkoutSession.dayId / SessionExercise.userExerciseId,
// which are onDelete: SetNull); absent => it's a new row to CREATE. Any day/
// exercise no longer present in the payload gets DELETEd. See
// workout-plan.repository.ts#updatePlan for the diff algorithm and the
// ownership check that keeps a client-supplied id from targeting another
// user's rows.
export const updatePlanSchema = z.object({
	planId: z.string().min(1),
	name: z.string().min(1, "Plan name required"),
	type: z.string().min(1, "Plan type required"),
	// No durationWeeks: the DB has no such column, and re-deriving
	// expiryDate = today + weeks on every save would push the expiry
	// forward each time the plan is edited. Editing modifies expiryDate
	// directly instead.
	expiryDate: z.date().nullable().optional(),
	days: z
		.array(
			z.object({
				id: z.string().min(1).optional(),
				...planDayShape,
				exercises: z.array(
					z.object({
						id: z.string().min(1).optional(),
						...planExerciseShape,
						// Always fully replaced: nothing FKs to ExerciseRep, so a
						// kept exercise still gets its reps deleteMany + re-created.
						reps: z
							.array(z.object(planRepShape))
							.min(1, "At least one set required"),
					}),
				),
			}),
		)
		.min(1, "At least one day required"),
});

export type UpdatePlanInput = z.input<typeof updatePlanSchema>;
export type UpdatePlanOutput = z.infer<typeof updatePlanSchema>;

export const deletePlanSchema = z.object({ planId: z.string().min(1) });
export type DeletePlanInput = z.infer<typeof deletePlanSchema>;

// ===== PLAN FORM SCHEMA (what the create/edit plan UI actually edits) =====
// The UI edits a single "SETS" counter + one target-reps value per exercise,
// not a raw array of per-set rows. This schema captures that shape; the
// resulting form output is expanded into an API-shaped `reps[]` array (one
// ExerciseRep row per set) via `toCreatePlanInput`/`toUpdatePlanInput` before
// it is sent to the router. `planId` presence is the create/edit discriminant.
export const planFormSchema = z
	.object({
		planId: z.string().optional(),
		name: z.string().min(1, "Plan name required"),
		type: z.string().min(1, "Plan type required"),
		// Create-only UI convenience that computes expiryDate client-side.
		// Optional here because edit mode edits expiryDate directly — see the
		// superRefine below, which requires it only when planId is absent.
		durationWeeks: z.coerce
			.number()
			.int()
			.min(1, "Duration must be at least 1 week")
			.optional(),
		expiryDate: z.date().nullable().optional(),
		days: z
			.array(
				z.object({
					// NOT named `id`: react-hook-form's useFieldArray always
					// overwrites `fields[i].id` with its own generated key, so a
					// field literally named `id` would be silently shadowed for
					// any read through `fields` (the underlying form *values*
					// still keep it, but the footgun isn't worth it). `dbId`
					// sidesteps it entirely.
					dbId: z.string().optional(),
					...planDayShape,
					exercises: z.array(
						z.object({
							dbId: z.string().optional(),
							...planExerciseShape,
							sets: z.coerce
								.number()
								.int()
								.min(1, "At least 1 set required")
								.max(20),
							// Required unless repsOverride carries a non-uniform
							// (pyramid) scheme — see the superRefine below.
							targetReps: z.string().optional(),
							targetRpe: z.number().optional(),
							weight: z.number().optional(),
							machineType: z.string().optional(),
							// Escape hatch for a plan whose per-set reps/rpe/weight
							// differ (a pyramid). The form only ever edits a single
							// uniform value + a sets counter, so a non-uniform
							// exercise carries its original rows here verbatim
							// instead of being silently flattened on save. See
							// planToFormValues / hasUniformSets below.
							repsOverride: z.array(z.object(planRepShape)).min(1).optional(),
						}),
					),
				}),
			)
			.min(1, "At least one day required"),
	})
	.superRefine((value, ctx) => {
		if (!value.planId && !value.durationWeeks) {
			ctx.addIssue({
				code: "custom",
				path: ["durationWeeks"],
				message: "Duration is required",
			});
		}
		value.days.forEach((day, dayIndex) => {
			day.exercises.forEach((exercise, exerciseIndex) => {
				if (!exercise.repsOverride && !exercise.targetReps?.trim()) {
					ctx.addIssue({
						code: "custom",
						path: ["days", dayIndex, "exercises", exerciseIndex, "targetReps"],
						message: "Reps required",
					});
				}
			});
		});
	});

export type PlanFormInput = z.input<typeof planFormSchema>;
export type PlanFormOutput = z.infer<typeof planFormSchema>;

/**
 * True when every set of an exercise shares the same targetReps/targetRpe/
 * weight/machineType and setNumber is contiguous starting at 1 — i.e. the
 * exercise can be represented by the form's single SETS counter + one
 * target-reps value without losing information. A pyramid scheme
 * (e.g. 8 / 6 / 4) is NOT uniform and must be preserved verbatim instead of
 * flattened. Exported so the plan-detail view and the edit form agree on
 * what "uniform" means.
 */
export function hasUniformSets(reps: readonly PlanRepRow[]): boolean {
	if (reps.length === 0) return true;
	const [first] = reps;
	return reps.every(
		(rep, index) =>
			rep.setNumber === index + 1 &&
			rep.targetReps === first.targetReps &&
			rep.targetRpe === first.targetRpe &&
			rep.weight === first.weight &&
			rep.machineType === first.machineType,
	);
}

export interface PlanRepRow {
	setNumber: number;
	targetReps?: string | null;
	targetRpe?: number | null;
	weight?: number | null;
	machineType?: string | null;
}

/**
 * Expands each exercise's form fields into API-shaped days/exercises: the
 * SETS counter (or a pyramid's `repsOverride`) becomes N `reps` rows, and
 * `order` is recomputed from array position rather than trusted from the
 * payload — `addExercise` in day-content.tsx assigns order from
 * `fields.length + 1` and removal never renumbers, so a stale client-side
 * order can otherwise collide after add/remove/add sequences. `dbId` is
 * promoted to `id` (present => update in place) or dropped (absent => create).
 */
function toApiDays(form: PlanFormOutput) {
	return form.days.map((day, dayIndex) => ({
		...(day.dbId ? { id: day.dbId } : {}),
		name: day.name,
		notes: day.notes,
		order: dayIndex + 1,
		exercises: day.exercises.map((exercise, exerciseIndex) => {
			const {
				dbId,
				sets,
				targetReps,
				targetRpe,
				weight,
				machineType,
				repsOverride,
				...rest
			} = exercise;
			return {
				...(dbId ? { id: dbId } : {}),
				...rest,
				order: exerciseIndex + 1,
				reps: repsOverride
					? repsOverride.map((rep, repIndex) => ({
							...rep,
							setNumber: repIndex + 1,
						}))
					: Array.from({ length: sets }, (_, setIndex) => ({
							setNumber: setIndex + 1,
							targetReps,
							targetRpe,
							weight,
							machineType,
						})),
			};
		}),
	}));
}

export function toCreatePlanInput(form: PlanFormOutput): CreatePlanOutput {
	return {
		name: form.name,
		type: form.type,
		durationWeeks: form.durationWeeks ?? 1,
		expiryDate: form.expiryDate ?? null,
		// toApiDays' conditional `id` spread only ever fires from a dbId, which
		// a create-mode form never has; createPlanSchema also has no `id` field
		// on days/exercises, so a stray key there would be a bug, not a
		// silently-accepted extra.
		days: toApiDays(form) as CreatePlanOutput["days"],
	};
}

export function toUpdatePlanInput(
	planId: string,
	form: PlanFormOutput,
): UpdatePlanOutput {
	return {
		planId,
		name: form.name,
		type: form.type,
		expiryDate: form.expiryDate ?? null,
		days: toApiDays(form) as UpdatePlanOutput["days"],
	};
}

// Structural shape of what `getPlanDetails`/`getPlanWithDetails` return,
// narrowed to only what `planToFormValues` needs. Deliberately not imported
// from Prisma — this type is consumed by a client-importable module.
export interface PlanDetailForForm {
	id: string;
	name: string;
	type: string;
	expiryDate: Date | null;
	days: Array<{
		id: string;
		name: string;
		notes: string | null;
		exercises: Array<{
			id: string;
			exerciseId: string;
			alternativeExerciseId: string | null;
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
		}>;
	}>;
}

// z.string().optional() rejects `null`, and a `null` value on a controlled
// <Input>/<Textarea> triggers React's controlled/uncontrolled warning — but
// Prisma returns `null`, not `undefined`, for every nullable column. `ns`
// backs fields with a bound text input (must never be null); `nz` backs
// optional non-text fields that currently have no input to control.
const ns = (value: string | null | undefined): string => value ?? "";
function nz<T>(value: T | null | undefined): T | undefined {
	return value ?? undefined;
}

/**
 * Inverse of toApiDays: turns a fetched plan into `planFormSchema` defaults
 * for the edit form. Must prefill every field even where day-content.tsx has
 * no input for it (alternativeExerciseId, supersetId/Order, targetRpe,
 * weight, machineType) — otherwise the very first save of an imported plan
 * would silently wipe them, since the form has no way to round-trip a value
 * it never rendered. `durationWeeks` is left undefined (see planFormSchema's
 * comment on it); the edit form swaps that input for an expiryDate field.
 */
export function planToFormValues(plan: PlanDetailForForm): PlanFormInput {
	return {
		planId: plan.id,
		name: plan.name,
		type: plan.type,
		durationWeeks: undefined,
		expiryDate: plan.expiryDate ?? null,
		days: plan.days.map((day, dayIndex) => ({
			dbId: day.id,
			name: day.name,
			order: dayIndex + 1,
			notes: ns(day.notes),
			exercises: day.exercises.map((exercise, exerciseIndex) => {
				const uniform = hasUniformSets(exercise.reps);
				const first = exercise.reps[0];
				return {
					dbId: exercise.id,
					exerciseId: exercise.exerciseId,
					alternativeExerciseId: nz(exercise.alternativeExerciseId),
					supersetId: nz(exercise.supersetId),
					supersetOrder: nz(exercise.supersetOrder),
					order: exerciseIndex + 1,
					restTime: nz(exercise.restTime),
					coachNotes: ns(exercise.coachNotes),
					personalNotes: ns(exercise.personalNotes),
					equipmentSetting1: ns(exercise.equipmentSetting1),
					equipmentSetting2: ns(exercise.equipmentSetting2),
					sets: exercise.reps.length || 1,
					targetReps: uniform
						? ns(first?.targetReps)
						: Array.from(
								new Set(
									exercise.reps.map((rep) => rep.targetReps).filter(Boolean),
								),
							).join(" / "),
					targetRpe: uniform ? nz(first?.targetRpe) : undefined,
					weight: uniform ? nz(first?.weight) : undefined,
					machineType: uniform ? nz(first?.machineType) : undefined,
					repsOverride: uniform
						? undefined
						: exercise.reps.map((rep) => ({
								setNumber: rep.setNumber,
								targetReps: nz(rep.targetReps),
								targetRpe: nz(rep.targetRpe),
								weight: nz(rep.weight),
								machineType: nz(rep.machineType),
							})),
				};
			}),
		})),
	};
}

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

export const getWorkoutDaySchema = z.object({
	dayId: z.string().min(1),
});

export type GetWorkoutDayInput = z.infer<typeof getWorkoutDaySchema>;

export const getSessionSchema = z.object({
	sessionId: z.string().min(1),
});

export type GetSessionInput = z.infer<typeof getSessionSchema>;

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
