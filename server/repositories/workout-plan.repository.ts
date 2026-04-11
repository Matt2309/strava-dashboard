import { prisma } from "@/lib/prisma";
import type {
	CreatePlanInput,
	GetPlanDetailsInput,
} from "@/lib/schemas/engine-room.schema";

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
			include: {
				days: {
					orderBy: { order: "asc" },
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
				},
			},
		});
	}

	async createPlan(userId: string, data: CreatePlanInput) {
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
								exerciseId: exercise.exerciseId,
								alternativeExerciseId: exercise.alternativeExerciseId || null,
								order: exercise.order,
								restTime: exercise.restTime || null,
								supersetId: exercise.supersetId || null,
								supersetOrder: exercise.supersetOrder || null,
								coachNotes: exercise.coachNotes || null,
								personalNotes: exercise.personalNotes || null,
								equipmentSetting1: exercise.equipmentSetting1 || null,
								equipmentSetting2: exercise.equipmentSetting2 || null,
								reps: {
									create: exercise.reps.map((rep) => ({
										setNumber: rep.setNumber,
										targetReps: rep.targetReps || null,
										targetRpe: rep.targetRpe || null,
										weight: rep.weight || null,
										machineType: rep.machineType || null,
									})),
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
