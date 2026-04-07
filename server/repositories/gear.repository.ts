import type { FunctionalType } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type GearFunctionalCreateInput = {
	stravaId: string;
	name: string;
	type: FunctionalType;
	distance: number;
	userId: string;
};

/**
 * Upsert a GearFunctional record by its Strava ID.
 * Creates a new record if it doesn't exist, updates distance otherwise.
 */
export async function upsertGearFunctional(input: GearFunctionalCreateInput) {
	return prisma.gearFunctional.upsert({
		where: { stravaId: input.stravaId },
		create: {
			stravaId: input.stravaId,
			name: input.name,
			type: input.type,
			distance: input.distance,
			userId: input.userId,
		},
		update: {
			name: input.name,
			distance: input.distance,
		},
	});
}

/**
 * Find a GearFunctional record by its Strava ID.
 */
export async function findGearFunctionalByStravaId(stravaId: string) {
	return prisma.gearFunctional.findUnique({ where: { stravaId } });
}

/**
 * Find all GearFunctional records for a user.
 */
export async function findGearFunctionalByUserId(userId: string) {
	return prisma.gearFunctional.findMany({
		where: { userId },
		orderBy: { name: "asc" },
	});
}

/**
 * Find all GearDevice records for a user.
 */
export async function findGearDevicesByUserId(userId: string) {
	return prisma.gearDevice.findMany({
		where: { userId },
		orderBy: { name: "asc" },
	});
}

/**
 * Find all gear (functional and devices) for a user.
 */
export async function findAllGearByUserId(userId: string) {
	const [functional, devices] = await Promise.all([
		findGearFunctionalByUserId(userId),
		findGearDevicesByUserId(userId),
	]);

	return { functional, devices };
}
