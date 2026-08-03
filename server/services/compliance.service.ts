import { deauthorizeStrava } from "@/server/infrastructure/strava.client";
import { purgeActivitiesRawDataBefore } from "@/server/repositories/activity.repository";
import {
	collectUserDataForExport,
	deleteUserById,
} from "@/server/repositories/user.repository";

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

export type UserDataExport = Awaited<ReturnType<typeof exportUserData>>;

/**
 * Builds a full export of a user's personal data (Art. 15 Right of Access /
 * Art. 20 Portability), wrapped in an envelope with export metadata.
 */
export async function exportUserData(userId: string) {
	const data = await collectUserDataForExport(userId);
	if (!data) throw new Error("Utente non trovato");

	const { Activity, GearFunctional, GearDevice, UserStatistics, ...user } =
		data;

	return {
		schemaVersion: 1,
		exportedAt: new Date(),
		source: "Dromos",
		user,
		activities: Activity,
		gearFunctional: GearFunctional,
		gearDevices: GearDevice,
		statistics: UserStatistics,
	};
}

/**
 * Permanently deletes a user's account (Art. 17 Right to Erasure).
 * Best-effort revokes the Strava authorization first — if that fails
 * (no connected account, Strava API error) it is logged and local deletion
 * proceeds regardless, since the user's erasure right cannot be blocked by
 * a third-party API call.
 */
export async function deleteUserAccount(userId: string) {
	await deauthorizeStrava(userId);
	await deleteUserById(userId);
	return { deleted: true };
}
