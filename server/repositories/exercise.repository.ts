import { prisma } from "@/lib/prisma";

export class ExerciseRepository {
	async getExercises(search?: string, muscleGroupId?: string) {
		return prisma.exercise.findMany({
			where: {
				AND: [
					muscleGroupId ? { muscleGroupId } : {},
					search
						? {
								OR: [
									{ nameEng: { contains: search, mode: "insensitive" } },
									{ nameIta: { contains: search, mode: "insensitive" } },
								],
							}
						: {},
				],
			},
			include: {
				muscleGroup: true,
			},
			take: 50,
		});
	}

	async getMuscleGroups() {
		return prisma.muscleGroup.findMany({
			orderBy: { name: "asc" },
		});
	}
}

export const exerciseRepository = new ExerciseRepository();
