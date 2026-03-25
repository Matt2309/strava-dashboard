import { type JsonValue, jsonToToon } from "@jojojoseph/toon-json-converter";
import { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {type Activity, activitySchema, athleteStatsSchema} from "@/lib/types";
import {
	fetchStravaForUser,
	getStravaAthleteId,
	getUserIdByStravaAthleteId,
	StravaClientError,
} from "@/server/infrastructure/strava.client";
import {
	countActivitiesByUserId,
	deleteActivityByStravaId,
	findActivitiesByUserId,
	upsertActivity,
} from "@/server/repositories/activity.repository";
import {
	type AthleteTotals,
	seedStatisticsFromAthleteStats,
	subtractStatistics,
	upsertStatistics,
} from "@/server/repositories/statistics.repository";

// ---------------------------------------------------------------------------
// Sport-type helpers
// ---------------------------------------------------------------------------

/**
 * Map a Strava sport_type string to the (sportName, terrainType) tuple used
 * in the UserStatistics table.
 */
export function categorizeSportType(sportType: string): {
	sportName: string;
	terrainType: string;
} {
	const mapping: Record<string, { sportName: string; terrainType: string }> = {
		Run: { sportName: "running", terrainType: "road" },
		TrackRun: { sportName: "running", terrainType: "road" },
		TrailRun: { sportName: "running", terrainType: "trail" },
		VirtualRun: { sportName: "running", terrainType: "road" },
		Ride: { sportName: "cycling", terrainType: "road" },
		VirtualRide: { sportName: "cycling", terrainType: "road" },
		MountainBikeRide: { sportName: "cycling", terrainType: "trail" },
		GravelRide: { sportName: "cycling", terrainType: "trail" },
		Swim: { sportName: "swimming", terrainType: "pool" },
		Walk: { sportName: "walking", terrainType: "road" },
		Hike: { sportName: "hiking", terrainType: "trail" },
	};
	return mapping[sportType] ?? { sportName: "other", terrainType: "other" };
}

// ---------------------------------------------------------------------------
// DB → UI type transform
// ---------------------------------------------------------------------------

/**
 * Transform a DB Activity row into the UI Activity type (Strava API format).
 */
function dbActivityToUiActivity(
	dbActivity: Awaited<ReturnType<typeof findActivitiesByUserId>>[number],
): Activity {
	return {
		id: Number(dbActivity.stravaId),
		name: dbActivity.name,
		distance: dbActivity.distance,
		moving_time: dbActivity.movingTime,
		elapsed_time: dbActivity.elapsedTime,
		total_elevation_gain: dbActivity.totalElevationGain,
		type: dbActivity.type,
		sport_type: dbActivity.sportType,
		start_date: dbActivity.startDate.toISOString(),
		average_heartrate: dbActivity.averageHeartrate ?? undefined,
		suffer_score: dbActivity.sufferScore ?? undefined,
	};
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Return activities for display in the UI.
 *
 * - If the user already has synced activities, return them from the DB.
 * - If this is the first connection, perform the initial heavy sync:
 *     1. Seed UserStatistics from athlete all-time totals.
 *     2. Fetch and persist the last 30 activities.
 */
export async function getActivitiesForUser(
	userId: string,
): Promise<Activity[]> {
	const count = await countActivitiesByUserId(userId);

	if (count > 0) {
		const dbActivities = await findActivitiesByUserId(userId);
		return dbActivities.map(dbActivityToUiActivity);
	}

	// First-time connection — run the full initial sync
	await runInitialSync(userId);

	const dbActivities = await findActivitiesByUserId(userId);
	return dbActivities.map(dbActivityToUiActivity);
}

/**
 * Get a single activity by Strava ID.
 * Fetch from Strava API with the user's token.
 */
export async function getActivityDetail(
	userId: string,
	stravaActivityId: string,
): Promise<Activity> {
	const result = await fetchStravaForUser<unknown>(
		userId,
		`activities/${stravaActivityId}`,
	);

	if (!result.ok || !result.data) {
		throw new StravaClientError(
			result.error || "Failed to fetch activity",
			result.statusCode,
		);
	}

	const parsed = activitySchema.safeParse(result.data);
	if (!parsed.success) {
		throw new StravaClientError("Invalid activity data from Strava API", 422);
	}

	return {
		id: parsed.data.id,
		name: parsed.data.name,
		distance: parsed.data.distance,
		moving_time: parsed.data.moving_time,
		elapsed_time: parsed.data.elapsed_time,
		total_elevation_gain: parsed.data.total_elevation_gain,
		type: parsed.data.type,
		sport_type: parsed.data.sport_type,
		start_date: parsed.data.start_date,
		average_heartrate: parsed.data.average_heartrate,
		suffer_score: parsed.data.suffer_score,
	};
}

/**
 * Export an activity to TOON JSON format.
 * Fetch the raw activity data from Strava API with the user's token.
 */
export async function getActivityToonExport(
	userId: string,
	stravaActivityId: string,
): Promise<string> {
	const result = await fetchStravaForUser<unknown>(
		userId,
		`activities/${stravaActivityId}`,
	);

	if (!result.ok || !result.data) {
		throw new StravaClientError(
			result.error || "Failed to fetch activity",
			result.statusCode,
		);
	}

	return jsonToToon(result.data as JsonValue);
}

/**
 * Perform the initial data fetch for a newly connected Strava user:
 *  1. Seed UserStatistics from athlete all-time totals.
 *  2. Fetch the last 30 activities and persist them.
 */
export async function runInitialSync(userId: string): Promise<void> {
	const athleteId = await getStravaAthleteId(userId);
	if (!athleteId) {
		throw new StravaClientError("Strava account not connected", 401);
	}

	// 1. Seed statistics baseline
	const statsResult = await fetchStravaForUser<unknown>(
		userId,
		`athletes/${athleteId}/stats`,
	);

	if (statsResult.ok && statsResult.data !== undefined) {
		const parsed = athleteStatsSchema.safeParse(statsResult.data);
		if (parsed.success) {
			const { all_run_totals, all_ride_totals } = parsed.data;
			await seedStatisticsFromAthleteStats(
				userId,
				all_run_totals as AthleteTotals,
				all_ride_totals as AthleteTotals,
			);
		}
	}

	// 2. Fetch and persist the last 30 activities
	const activitiesResult = await fetchStravaForUser<unknown[]>(
		userId,
		"athlete/activities?per_page=30",
	);

	if (!activitiesResult.ok || !activitiesResult.data) return;

	const activities = z
		.array(activitySchema)
		.safeParse(activitiesResult.data);
	if (!activities.success) return;

	for (const activity of activities.data) {
		await persistStravaActivity(userId, activity);
	}
}

/**
 * Save a Strava activity object to the DB and update UserStatistics.
 */
async function persistStravaActivity(
	userId: string,
	activity: Activity,
): Promise<void> {
	const { sportName, terrainType } = categorizeSportType(activity.sport_type);

	await upsertActivity({
		stravaId: String(activity.id),
		name: activity.name,
		distance: activity.distance,
		movingTime: activity.moving_time,
		elapsedTime: activity.elapsed_time,
		totalElevationGain: activity.total_elevation_gain,
		type: activity.type,
		sportType: activity.sport_type,
		startDate: new Date(activity.start_date),
		averageHeartrate: activity.average_heartrate,
		sufferScore: activity.suffer_score,
		rawJson: activity as unknown as Prisma.InputJsonValue,
		userId,
	});

	await upsertStatistics(userId, sportName, terrainType, {
		distanceMeters: activity.distance,
		movingTimeSeconds: activity.moving_time,
		elevationGainMeters: activity.total_elevation_gain,
		startDate: new Date(activity.start_date),
	});
}

// ---------------------------------------------------------------------------
// Webhook event processing
// ---------------------------------------------------------------------------

export const webhookEventSchema = z.object({
	aspect_type: z.enum(["create", "update", "delete"]),
	event_time: z.number(),
	object_id: z.number(), // Strava activity ID
	object_type: z.enum(["activity", "athlete"]),
	owner_id: z.number(), // Strava athlete ID
	subscription_id: z.number(),
	updates: z.record(z.string(), z.unknown()).optional(),
});

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

/**
 * Process a single Strava webhook event.
 * Returns early (silently) for non-activity events.
 */
export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
	if (event.object_type !== "activity") return;

	const userId = await getUserIdByStravaAthleteId(String(event.owner_id));
	if (!userId) return; // unknown athlete — ignore

	const stravaActivityId = String(event.object_id);

	switch (event.aspect_type) {
		case "create":
			await handleWebhookCreate(userId, stravaActivityId);
			break;
		case "update":
			await handleWebhookUpdate(userId, stravaActivityId);
			break;
		case "delete":
			await handleWebhookDelete(userId, stravaActivityId);
			break;
	}
}

async function handleWebhookCreate(
	userId: string,
	stravaActivityId: string,
): Promise<void> {
	const result = await fetchStravaForUser<unknown>(
		userId,
		`activities/${stravaActivityId}`,
	);

	if (!result.ok || !result.data) return;

	const parsed = activitySchema.safeParse(result.data);
	if (!parsed.success) return;

	await persistStravaActivity(userId, parsed.data);
}

async function handleWebhookUpdate(
	userId: string,
	stravaActivityId: string,
): Promise<void> {
	// Re-fetch the full activity to get any updated fields
	await handleWebhookCreate(userId, stravaActivityId);
}

async function handleWebhookDelete(
	userId: string,
	stravaActivityId: string,
): Promise<void> {
	const deleted = await deleteActivityByStravaId(stravaActivityId);
	if (!deleted) return; // was not in our DB — nothing to subtract

	const { sportName, terrainType } = categorizeSportType(deleted.sportType);

	await subtractStatistics(userId, sportName, terrainType, {
		distanceMeters: deleted.distance,
		movingTimeSeconds: deleted.movingTime,
		elevationGainMeters: deleted.totalElevationGain,
		startDate: deleted.startDate,
	});
}

/**
 * Checks if a user has a valid, non-expired Strava OAuth connection.
 */
export async function isStravaConnected(userId: string): Promise<boolean> {
	const account = await prisma.account.findFirst({
		where: {
			userId,
			providerId: "strava",
		},
		select: {
			accessToken: true,
			accessTokenExpiresAt: true,
		},
	});

	if (!account?.accessToken) {
		return false;
	}

	if (!account.accessTokenExpiresAt) {
		return true;
	}

	return account.accessTokenExpiresAt > new Date();
}
