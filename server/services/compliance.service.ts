import { deauthorizeStrava } from "@/server/infrastructure/strava.client";
import {
	eraseHealthDataForUser,
	purgeActivitiesRawDataBefore,
} from "@/server/repositories/activity.repository";
import {
	collectUserDataForExport,
	deleteUserById,
	getHealthDataConsent,
	type HealthDataConsentStatus,
	setHealthDataConsent,
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

/**
 * Current health data consent decision for the user (Art. 9 GDPR — heart
 * rate, suffer score). `decided: false` means the Garage gate should be
 * shown before any activity sync runs.
 */
export async function getHealthDataConsentStatus(
	userId: string,
): Promise<HealthDataConsentStatus> {
	return getHealthDataConsent(userId);
}

/**
 * Records the user's health data consent decision. Refusing or revoking
 * (`granted: false`) also erases any health data already collected — the
 * consent must be as easy to withdraw as it was to give (Art. 7(3)), and
 * withdrawal should actually stop the processing, not just future writes.
 */
export async function setHealthDataConsentDecision(
	userId: string,
	granted: boolean,
) {
	await setHealthDataConsent(userId, granted);

	if (!granted) {
		await eraseHealthDataForUser(userId);
	}

	return { granted };
}
