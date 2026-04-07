import { prisma } from "@/lib/prisma";

export type StatsDelta = {
	distanceMeters: number; // metres
	movingTimeSeconds: number; // seconds
	elevationGainMeters: number; // metres
	startDate: Date;
};

/**
 * Upsert the UserStatistics row for [userId, sportName, terrainType].
 * When creating a new row the provided delta values are used as the initial
 * totals.  When updating an existing row the deltas are added to the running
 * totals and max-records are updated where applicable.
 */
export async function upsertStatistics(
	userId: string,
	sportName: string,
	terrainType: string,
	delta: StatsDelta,
): Promise<void> {
	const distanceKm = delta.distanceMeters / 1000;
	const elevationM = Math.round(delta.elevationGainMeters);

	const existing = await prisma.userStatistics.findUnique({
		where: {
			userId_sport_name_terrain_type: {
				userId,
				sport_name: sportName,
				terrain_type: terrainType,
			},
		},
	});

	if (!existing) {
		await prisma.userStatistics.create({
			data: {
				userId,
				sport_name: sportName,
				terrain_type: terrainType,
				total_distance_km: distanceKm,
				total_time_min: delta.movingTimeSeconds,
				total_elevation_m: elevationM,
				sessions_count: 1,
				max_distance_km: distanceKm,
				max_elevation_m: elevationM,
				last_activity_date: delta.startDate,
				updated_at: new Date(),
			},
		});
		return;
	}

	await prisma.userStatistics.update({
		where: { id: existing.id },
		data: {
			total_distance_km: existing.total_distance_km + distanceKm,
			total_time_min: existing.total_time_min + delta.movingTimeSeconds,
			total_elevation_m: existing.total_elevation_m + elevationM,
			sessions_count: existing.sessions_count + 1,
			max_distance_km: Math.max(existing.max_distance_km, distanceKm),
			max_elevation_m: Math.max(existing.max_elevation_m, elevationM),
			last_activity_date:
				delta.startDate > existing.last_activity_date
					? delta.startDate
					: existing.last_activity_date,
			updated_at: new Date(),
		},
	});
}

/**
 * Subtract a delta from the UserStatistics row for [userId, sportName, terrainType].
 * Used when a Strava activity is deleted.  The row is NOT deleted because the
 * session/max records from other activities would be lost.
 * If no matching row exists, this is a no-op.
 */
export async function subtractStatistics(
	userId: string,
	sportName: string,
	terrainType: string,
	delta: StatsDelta,
): Promise<void> {
	const existing = await prisma.userStatistics.findUnique({
		where: {
			userId_sport_name_terrain_type: {
				userId,
				sport_name: sportName,
				terrain_type: terrainType,
			},
		},
	});

	if (!existing) return;

	const distanceKm = delta.distanceMeters / 1000;
	const elevationM = Math.round(delta.elevationGainMeters);

	await prisma.userStatistics.update({
		where: { id: existing.id },
		data: {
			total_distance_km: Math.max(0, existing.total_distance_km - distanceKm),
			total_time_min: Math.max(
				0,
				existing.total_time_min - delta.movingTimeSeconds,
			),
			total_elevation_m: Math.max(0, existing.total_elevation_m - elevationM),
			sessions_count: Math.max(0, existing.sessions_count - 1),
			updated_at: new Date(),
		},
	});
}

/**
 * Apply a delta to the UserStatistics row for [userId, sportName, terrainType].
 * Unlike upsertStatistics, this:
 *  - Does NOT increment sessions_count (used for activity updates, not new activities)
 *  - Allows negative deltas (for corrections when activity values decrease)
 *  - Only updates max_distance_km/max_elevation_m if the new activity values are higher
 *
 * If no matching row exists, creates one with the delta values and sessions_count = 0.
 * The sessions_count should be incremented separately only when a truly new activity is created.
 */
export async function applyStatisticsDelta(
	userId: string,
	sportName: string,
	terrainType: string,
	delta: StatsDelta,
	/** The new absolute values of the activity (for updating max records) */
	newActivityValues?: { distanceMeters: number; elevationGainMeters: number },
): Promise<void> {
	const distanceKmDelta = delta.distanceMeters / 1000;
	const elevationMDelta = Math.round(delta.elevationGainMeters);

	const existing = await prisma.userStatistics.findUnique({
		where: {
			userId_sport_name_terrain_type: {
				userId,
				sport_name: sportName,
				terrain_type: terrainType,
			},
		},
	});

	if (!existing) {
		// Create a new row with delta values but sessions_count = 0
		// (caller should increment sessions_count separately for new activities)
		await prisma.userStatistics.create({
			data: {
				userId,
				sport_name: sportName,
				terrain_type: terrainType,
				total_distance_km: Math.max(0, distanceKmDelta),
				total_time_min: Math.max(0, delta.movingTimeSeconds),
				total_elevation_m: Math.max(0, elevationMDelta),
				sessions_count: 0,
				max_distance_km: newActivityValues
					? newActivityValues.distanceMeters / 1000
					: Math.max(0, distanceKmDelta),
				max_elevation_m: newActivityValues
					? Math.round(newActivityValues.elevationGainMeters)
					: Math.max(0, elevationMDelta),
				last_activity_date: delta.startDate,
				updated_at: new Date(),
			},
		});
		return;
	}

	// Apply delta to existing row
	const newTotalDistance = existing.total_distance_km + distanceKmDelta;
	const newTotalTime = existing.total_time_min + delta.movingTimeSeconds;
	const newTotalElevation = existing.total_elevation_m + elevationMDelta;

	// For max values, use the new activity's absolute values if provided
	const newActivityDistanceKm = newActivityValues
		? newActivityValues.distanceMeters / 1000
		: 0;
	const newActivityElevationM = newActivityValues
		? Math.round(newActivityValues.elevationGainMeters)
		: 0;

	await prisma.userStatistics.update({
		where: { id: existing.id },
		data: {
			total_distance_km: Math.max(0, newTotalDistance),
			total_time_min: Math.max(0, newTotalTime),
			total_elevation_m: Math.max(0, newTotalElevation),
			// sessions_count is NOT modified - this is intentional for updates
			max_distance_km: Math.max(
				existing.max_distance_km,
				newActivityDistanceKm,
			),
			max_elevation_m: Math.max(
				existing.max_elevation_m,
				newActivityElevationM,
			),
			last_activity_date:
				delta.startDate > existing.last_activity_date
					? delta.startDate
					: existing.last_activity_date,
			updated_at: new Date(),
		},
	});
}

/**
 * Seed statistics from Strava's all-time athlete totals endpoint.
 * Creates a baseline row for each sport category if one does not yet exist.
 */
export type AthleteTotals = {
	count: number;
	distance: number; // metres
	moving_time: number; // seconds
	elevation_gain: number; // metres
};

export async function seedStatisticsFromAthleteStats(
	userId: string,
	runTotals: AthleteTotals,
	rideTotals: AthleteTotals,
): Promise<void> {
	const seedEntries: Array<{
		sportName: string;
		terrainType: string;
		totals: AthleteTotals;
	}> = [
		{ sportName: "running", terrainType: "road", totals: runTotals },
		{ sportName: "cycling", terrainType: "road", totals: rideTotals },
	];

	for (const entry of seedEntries) {
		if (entry.totals.count === 0) continue;

		const existing = await prisma.userStatistics.findUnique({
			where: {
				userId_sport_name_terrain_type: {
					userId,
					sport_name: entry.sportName,
					terrain_type: entry.terrainType,
				},
			},
		});

		if (existing) continue; // already has data — do not overwrite

		const distanceKm = entry.totals.distance / 1000;
		const elevationM = Math.round(entry.totals.elevation_gain);

		await prisma.userStatistics.create({
			data: {
				userId,
				sport_name: entry.sportName,
				terrain_type: entry.terrainType,
				total_distance_km: distanceKm,
				total_time_min: entry.totals.moving_time,
				total_elevation_m: elevationM,
				sessions_count: entry.totals.count,
				max_distance_km: 0,
				max_elevation_m: 0,
				last_activity_date: new Date(),
				updated_at: new Date(),
			},
		});
	}
}
