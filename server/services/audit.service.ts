import {
	type AuditEventInput,
	pseudonymizeAuditSubject,
	recordAuditEvent,
} from "@/server/repositories/audit-log.repository";

/**
 * Writes a single audit event without ever propagating an error. An audit
 * log write that fails must never block the caller's own operation — a
 * login, an export, or above all an account deletion: blocking Art. 17 for a
 * logging problem would be a worse violation than the one this is meant to
 * prevent.
 *
 * Use this for every audit write EXCEPT the ones that must be atomic with a
 * consent mutation (see server/repositories/legal-consent.repository.ts and
 * server/repositories/user.repository.ts), where `recordAuditEvent` is
 * called directly inside the same `$transaction` instead — there, a failed
 * audit write should roll back the consent write too, since a consent
 * recorded without proof is worse than no consent at all.
 */
export async function recordAuditEventSafe(input: AuditEventInput): Promise<void> {
	try {
		await recordAuditEvent(input);
	} catch (error) {
		console.error("[Audit] Failed to record audit event", input.action, error);
	}
}

/**
 * Pseudonymizes a user's audit trail without ever propagating an error. Only
 * called after account deletion has already succeeded — if this fails, the
 * account is still gone (fail-safe); the affected rows keep a plaintext
 * subjectId for a user that no longer exists, recoverable by re-running this
 * function rather than by blocking the deletion.
 */
export async function pseudonymizeUserAuditTrail(userId: string): Promise<void> {
	try {
		await pseudonymizeAuditSubject(userId);
	} catch (error) {
		console.error("[Audit] Failed to pseudonymize audit trail", error);
	}
}
