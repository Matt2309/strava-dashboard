import { purgeActivitiesRawDataBefore } from "@/server/repositories/activity.repository";

const PURGE_AFTER_DAYS = 7;

/**
 * Nullifies the rawJson field for every Activity that was synced more than
 * PURGE_AFTER_DAYS days ago and has not already been purged.
 *
 * The aggregated UserStatistics rows are NOT modified by this function,
 * preserving all historical metrics.
 *
 * This function is safe to run repeatedly (idempotent due to the isPurged flag).
 *
 * @returns The number of activity records that were purged.
 */
export async function purgeStaleActivityData(): Promise<number> {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - PURGE_AFTER_DAYS);

	return purgeActivitiesRawDataBefore(cutoff);
}
