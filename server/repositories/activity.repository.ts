import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ActivityCreateInput = {
	stravaId: string;
	name: string;
	distance: number;
	movingTime: number;
	elapsedTime: number;
	totalElevationGain: number;
	type: string;
	sportType: string;
	startDate: Date;
	averageHeartrate?: number | null;
	sufferScore?: number | null;
	rawJson?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
	userId: string;
};

export type ActivityUpdateInput = Partial<
	Omit<ActivityCreateInput, "stravaId" | "userId">
>;

/**
 * Upsert an activity by its Strava ID.
 * Creates a new record if it doesn't exist, updates it otherwise.
 */
export async function upsertActivity(input: ActivityCreateInput) {
	return prisma.activity.upsert({
		where: { stravaId: input.stravaId },
		create: {
			stravaId: input.stravaId,
			name: input.name,
			distance: input.distance,
			movingTime: input.movingTime,
			elapsedTime: input.elapsedTime,
			totalElevationGain: input.totalElevationGain,
			type: input.type,
			sportType: input.sportType,
			startDate: input.startDate,
			averageHeartrate: input.averageHeartrate,
			sufferScore: input.sufferScore,
			rawJson: input.rawJson,
			userId: input.userId,
		},
		update: {
			name: input.name,
			distance: input.distance,
			movingTime: input.movingTime,
			elapsedTime: input.elapsedTime,
			totalElevationGain: input.totalElevationGain,
			type: input.type,
			sportType: input.sportType,
			startDate: input.startDate,
			averageHeartrate: input.averageHeartrate,
			sufferScore: input.sufferScore,
			rawJson: input.rawJson,
		},
	});
}

/**
 * Find an activity by its Strava ID.
 */
export async function findActivityByStravaId(stravaId: string) {
	return prisma.activity.findUnique({ where: { stravaId } });
}

/**
 * Delete an activity by its Strava ID.
 * Returns the deleted record so callers can adjust statistics, or null if not found.
 */
export async function deleteActivityByStravaId(stravaId: string) {
	try {
		return await prisma.activity.delete({ where: { stravaId } });
	} catch {
		return null;
	}
}

/**
 * Count activities belonging to a user.
 */
export async function countActivitiesByUserId(userId: string): Promise<number> {
	return prisma.activity.count({ where: { userId } });
}

/**
 * Return all activities for a user, ordered by start date descending.
 */
export async function findActivitiesByUserId(userId: string) {
	return prisma.activity.findMany({
		where: { userId },
		orderBy: { startDate: "desc" },
	});
}

/**
 * Find activities that were synced more than `days` days ago and have not
 * yet been purged.
 */
export async function findActivitiesForPurge(days: number) {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);

	return prisma.activity.findMany({
		where: {
			createdAt: { lt: cutoff },
			isPurged: false,
		},
	});
}

/**
 * Nullify raw GPS / JSON data for an activity and mark it as purged.
 * The aggregated statistics remain untouched.
 */
export async function purgeActivityRawData(id: string) {
	return prisma.activity.update({
		where: { id },
		data: { rawJson: Prisma.JsonNull, isPurged: true },
	});
}
