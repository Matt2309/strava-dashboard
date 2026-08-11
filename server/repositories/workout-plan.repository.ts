import { prisma } from "@/lib/prisma";
import type {
	CreatePlanOutput,
	UpdatePlanOutput,
} from "@/lib/schemas/engine-room.schema";

type PlanExerciseInput = CreatePlanOutput["days"][number]["exercises"][number];
type PlanRepInput = PlanExerciseInput["reps"][number];

/**
 * Scalar fields shared by `UserExercise` create and update. `?? null`, not
 * `|| null`: `restTime`/`supersetOrder` of 0 (and `weight`/`targetRpe` of 0
 * in `toRepCreate`) are legitimate values that `||` would silently coerce
 * to null.
 */
function toUserExerciseScalars(exercise: PlanExerciseInput) {
	return {
		exerciseId: exercise.exerciseId,
		alternativeExerciseId: exercise.alternativeExerciseId ?? null,
		restTime: exercise.restTime ?? null,
		supersetId: exercise.supersetId ?? null,
		supersetOrder: exercise.supersetOrder ?? null,
		coachNotes: exercise.coachNotes ?? null,
		personalNotes: exercise.personalNotes ?? null,
		equipmentSetting1: exercise.equipmentSetting1 ?? null,
		equipmentSetting2: exercise.equipmentSetting2 ?? null,
	};
}

function toRepCreate(rep: PlanRepInput) {
	return {
		setNumber: rep.setNumber,
		targetReps: rep.targetReps ?? null,
		targetRpe: rep.targetRpe ?? null,
		weight: rep.weight ?? null,
		machineType: rep.machineType ?? null,
	};
}

const planDetailInclude = {
	days: {
		orderBy: { order: "asc" as const },
		include: {
			exercises: {
				orderBy: { order: "asc" as const },
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
						orderBy: { setNumber: "asc" as const },
					},
				},
			},
		},
	},
};

export class WorkoutPlanRepository {
	async getUserPlans(userId: string) {
		return prisma.userWorkoutPlan.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
	}

	async getPlanWithDetails(planId: string, userId: string) {
		return prisma.userWorkoutPlan.findUnique({
			where: { id: planId },
			include: planDetailInclude,
		});
	}

	async createPlan(userId: string, data: CreatePlanOutput) {
		const plan = await prisma.userWorkoutPlan.create({
			data: {
				userId,
				name: data.name,
				type: data.type,
				expiryDate: data.expiryDate || null,
				days: {
					create: data.days.map((day) => ({
						name: day.name,
						order: day.order,
						notes: day.notes || null,
						exercises: {
							create: day.exercises.map((exercise) => ({
								...toUserExerciseScalars(exercise),
								order: exercise.order,
								reps: {
									create: exercise.reps.map(toRepCreate),
								},
							})),
						},
					})),
				},
			},
			include: {
				days: {
					include: {
						exercises: {
							include: {
								exercise: true,
								reps: true,
							},
						},
					},
				},
			},
		});

		return plan;
	}

	/**
	 * Diff-based update: days/exercises carrying a client-supplied `id` are
	 * updated in place (keeps `WorkoutSession.dayId` /
	 * `SessionExercise.userExerciseId` — both `onDelete: SetNull` — pointing
	 * at the same row so past sessions don't lose their link); anything
	 * without an `id` is a new row; anything present before but missing from
	 * the payload is deleted. `ExerciseRep` rows are always fully replaced —
	 * nothing has a foreign key into them.
	 */
	async updatePlan(planId: string, userId: string, data: UpdatePlanOutput) {
		return prisma.$transaction(
			async (tx) => {
				// --- 1. Ownership + id-tampering guard --------------------------
				// Every write below targets `where: { id }`, which has no userId
				// column to filter on — without checking that every client-
				// supplied day/exercise id actually belongs to THIS plan (and,
				// for exercises, to the specific day it claims to be under),
				// updatePlan would be an authenticated arbitrary-row-write
				// primitive: a forged id from another user's plan would be
				// updated or (via the deleteMany below) deleted right along with
				// the caller's own rows.
				const existing = await tx.userWorkoutPlan.findFirst({
					where: { id: planId, userId },
					select: {
						id: true,
						days: {
							select: { id: true, exercises: { select: { id: true } } },
						},
					},
				});
				if (!existing) {
					throw new Error("Plan not found or unauthorized");
				}

				const ownedExercisesByDay = new Map(
					existing.days.map((day) => [
						day.id,
						new Set(day.exercises.map((exercise) => exercise.id)),
					]),
				);

				for (const day of data.days) {
					if (day.id && !ownedExercisesByDay.has(day.id)) {
						throw new Error("Plan not found or unauthorized");
					}
					for (const exercise of day.exercises) {
						if (!exercise.id) continue;
						if (!day.id) {
							// An existing exercise id can't appear under a brand-new
							// day — that's an incoherent (forged or stale) payload.
							throw new Error("Invalid plan payload");
						}
						if (!ownedExercisesByDay.get(day.id)?.has(exercise.id)) {
							throw new Error("Plan not found or unauthorized");
						}
					}
				}

				// --- 2. Delete days removed from the payload ---------------------
				// Cascades to their UserExercise + ExerciseRep rows.
				// WorkoutSession rows referencing a deleted day survive with
				// dayId = null (onDelete: SetNull) — history is kept, just
				// disconnected from the (now-gone) day.
				const keptDayIds = data.days.flatMap((day) => (day.id ? [day.id] : []));
				await tx.workoutDay.deleteMany({
					where: {
						planId,
						// Branch explicitly instead of always passing `notIn`:
						// Prisma's `notIn: []` / `in: []` semantics aren't
						// symmetric, so this makes "no days kept => delete all
						// days" an intentional case rather than an accident.
						...(keptDayIds.length > 0 ? { id: { notIn: keptDayIds } } : {}),
					},
				});

				// --- 3. Delete exercises removed from each surviving day --------
				for (const day of data.days) {
					if (!day.id) continue;
					const keptExerciseIds = day.exercises.flatMap((exercise) =>
						exercise.id ? [exercise.id] : [],
					);
					await tx.userExercise.deleteMany({
						where: {
							dayId: day.id,
							...(keptExerciseIds.length > 0
								? { id: { notIn: keptExerciseIds } }
								: {}),
						},
					});
				}

				// --- 4. Update kept rows / create new ones -----------------------
				for (const [dayIndex, day] of data.days.entries()) {
					// `order` is never trusted from the payload — recomputed from
					// position, same as in toApiDays.
					const dayOrder = dayIndex + 1;

					if (!day.id) {
						await tx.workoutDay.create({
							data: {
								planId,
								name: day.name,
								order: dayOrder,
								notes: day.notes || null,
								exercises: {
									create: day.exercises.map((exercise, exerciseIndex) => ({
										...toUserExerciseScalars(exercise),
										order: exerciseIndex + 1,
										reps: { create: exercise.reps.map(toRepCreate) },
									})),
								},
							},
						});
						continue;
					}

					await tx.workoutDay.update({
						where: { id: day.id },
						data: { name: day.name, order: dayOrder, notes: day.notes || null },
					});

					for (const [exerciseIndex, exercise] of day.exercises.entries()) {
						const exerciseOrder = exerciseIndex + 1;

						if (exercise.id) {
							await tx.userExercise.update({
								where: { id: exercise.id },
								data: {
									...toUserExerciseScalars(exercise),
									order: exerciseOrder,
									// Safe to fully replace: nothing FKs to
									// ExerciseRep, and SessionSet stores its own
									// reps/weight/rpe, so past sessions are
									// unaffected. `deleteMany: {}` here is scoped
									// to this UserExercise's own reps only.
									reps: {
										deleteMany: {},
										create: exercise.reps.map(toRepCreate),
									},
								},
							});
						} else {
							await tx.userExercise.create({
								data: {
									dayId: day.id,
									...toUserExerciseScalars(exercise),
									order: exerciseOrder,
									reps: { create: exercise.reps.map(toRepCreate) },
								},
							});
						}
					}
				}

				// --- 5. Plan scalars -----------------------------------------------
				await tx.userWorkoutPlan.update({
					where: { id: planId },
					data: {
						name: data.name,
						type: data.type,
						expiryDate: data.expiryDate ?? null,
					},
				});

				return tx.userWorkoutPlan.findUnique({
					where: { id: planId },
					include: planDetailInclude,
				});
			},
			// A large plan (many days x many exercises) is dozens of sequential
			// round trips; the default 5s interactive-transaction timeout is
			// too tight for that.
			{ maxWait: 5_000, timeout: 20_000 },
		);
	}

	async deletePlan(planId: string, userId: string) {
		return prisma.userWorkoutPlan.deleteMany({
			where: {
				id: planId,
				userId,
			},
		});
	}
}

export const workoutPlanRepository = new WorkoutPlanRepository();
