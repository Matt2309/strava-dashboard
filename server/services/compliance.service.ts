import { deauthorizeStrava } from "@/server/infrastructure/strava.client";
import {
	eraseHealthDataForUser,
	purgeActivitiesRawDataBefore,
} from "@/server/repositories/activity.repository";
import {
	getAuditLogForUser,
	purgeAuditLogsBefore,
} from "@/server/repositories/audit-log.repository";
import {
	type LegalConsentDocuments,
	recordLegalConsent,
} from "@/server/repositories/legal-consent.repository";
import { getLatestPolicy } from "@/server/repositories/policy.repository";
import { getLatestTerms } from "@/server/repositories/terms.repository";
import {
	collectUserDataForExport,
	deleteUserById,
	getHealthDataConsent,
	type HealthDataConsentStatus,
	setHealthDataConsent,
} from "@/server/repositories/user.repository";
import {
	pseudonymizeUserAuditTrail,
	recordAuditEventSafe,
} from "@/server/services/audit.service";

const PURGE_AFTER_DAYS = 7;
const AUDIT_LOG_RETENTION_DAYS = 730; // 24 months

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

/**
 * Deletes audit log rows older than AUDIT_LOG_RETENTION_DAYS (Art. 5(1)(e)
 * storage limitation — an audit trail kept forever is itself a compliance
 * gap). Idempotent: re-running it only ever removes rows already past the
 * cutoff.
 *
 * @returns The number of audit log rows purged.
 */
export async function purgeStaleAuditLogs(): Promise<number> {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - AUDIT_LOG_RETENTION_DAYS);

	return purgeAuditLogsBefore(cutoff);
}

export type UserDataExport = Awaited<ReturnType<typeof exportUserData>>;

/**
 * Builds a full export of a user's personal data (Art. 15 Right of Access /
 * Art. 20 Portability), wrapped in an envelope with export metadata.
 *
 * The audit log is included in the export — audit rows about this user are
 * themselves personal data — and the DATA_EXPORTED event is recorded only
 * *after* that read, so the export doesn't contain the record of itself.
 */
export async function exportUserData(userId: string) {
	const data = await collectUserDataForExport(userId);
	if (!data) throw new Error("Utente non trovato");

	const { Activity, GearFunctional, GearDevice, UserStatistics, ...user } =
		data;
	const auditLog = await getAuditLogForUser(userId);

	await recordAuditEventSafe({ subjectId: userId, action: "DATA_EXPORTED" });

	return {
		schemaVersion: 1,
		exportedAt: new Date(),
		source: "Dromos",
		user,
		activities: Activity,
		gearFunctional: GearFunctional,
		gearDevices: GearDevice,
		statistics: UserStatistics,
		auditLog,
	};
}

/**
 * Permanently deletes a user's account (Art. 17 Right to Erasure).
 * Best-effort revokes the Strava authorization first — if that fails
 * (no connected account, Strava API error) it is logged and local deletion
 * proceeds regardless, since the user's erasure right cannot be blocked by
 * a third-party API call.
 *
 * The ACCOUNT_DELETED event is recorded with the real userId *before* the
 * delete runs (the row must exist to reference a real subject at write
 * time), then that same audit trail — including the event just written —
 * is pseudonymized right after the delete succeeds. If the account row is
 * already gone but pseudonymization fails, the account is still deleted
 * (fail-safe): a stray plaintext audit row is recoverable by re-running the
 * pseudonymization, unlike a blocked erasure.
 */
export async function deleteUserAccount(userId: string) {
	await recordAuditEventSafe({ subjectId: userId, action: "ACCOUNT_DELETED" });
	await deauthorizeStrava(userId);
	await deleteUserById(userId);
	await pseudonymizeUserAuditTrail(userId);
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
		const erasedActivities = await eraseHealthDataForUser(userId);
		await recordAuditEventSafe({
			subjectId: userId,
			action: "HEALTH_DATA_ERASED",
			metadata: { erasedActivities },
		});
	}

	return { granted };
}

/**
 * Resolves the currently active privacy policy and/or terms & conditions and
 * records the user's acceptance of them, atomically with the corresponding
 * audit event (see server/repositories/legal-consent.repository.ts). The
 * documents to accept are resolved server-side — the client only signals
 * which ones it presented and got checked — so a caller can never certify
 * acceptance of an arbitrary id.
 */
export async function recordLegalConsentDecision(
	userId: string,
	choices: { policy: boolean; terms: boolean },
): Promise<void> {
	const documents: LegalConsentDocuments = {};

	if (choices.policy) {
		const activePolicy = await getLatestPolicy();
		if (!activePolicy) throw new Error("Nessuna policy attiva trovata");
		documents.policy = { id: activePolicy.id, version: activePolicy.version };
	}

	if (choices.terms) {
		const activeTerms = await getLatestTerms();
		if (!activeTerms) throw new Error("Nessun termini attivi trovati");
		documents.terms = { id: activeTerms.id, version: activeTerms.version };
	}

	await recordLegalConsent(userId, documents);
}
