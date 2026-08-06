import { createHash } from "node:crypto";
import type { AuditAction, Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Accepts either the global client or a $transaction's `tx`: both satisfy
// this shape, so callers that need the write atomic with another mutation
// (e.g. a consent update) can pass `tx` without us having to type the
// extended client's TransactionClient explicitly.
type AuditWriteClient = Pick<typeof prisma, "auditLog">;

export type AuditEventInput = {
	subjectId: string;
	action: AuditAction;
	metadata?: Prisma.InputJsonValue;
};

/**
 * Appends a single audit event. Deliberately NOT wrapped in try/catch here —
 * callers that need the write to be best-effort (never block the caller's
 * own operation) should go through `recordAuditEventSafe` in
 * server/services/audit.service.ts instead. Callers that need the audit
 * event to be atomic with a mutation (e.g. consent acceptance) should pass
 * `client` as the enclosing `$transaction`'s `tx`, so both succeed or both
 * roll back together.
 */
export async function recordAuditEvent(
	input: AuditEventInput,
	client: AuditWriteClient = prisma,
) {
	return client.auditLog.create({
		data: {
			subjectId: input.subjectId,
			action: input.action,
			metadata: input.metadata,
		},
	});
}

/**
 * Replaces every non-pseudonymized audit row's subjectId for this user with
 * a SHA-256 hash of the original id. Called once, after account deletion
 * (Art. 17 Right to Erasure), so the audit trail survives as proof of what
 * happened (Art. 5(2) accountability) without keeping a directly
 * attributable identifier for a user who no longer exists.
 *
 * Plain SHA-256 (not HMAC) is intentional: it lets a user independently
 * verify that their former id hashes to the stored value, without needing a
 * server-held key. A cuid has enough entropy that reversing the hash is
 * infeasible.
 *
 * @returns The number of rows pseudonymized.
 */
export async function pseudonymizeAuditSubject(userId: string): Promise<number> {
	const hashedSubjectId = createHash("sha256").update(userId).digest("hex");

	const { count } = await prisma.auditLog.updateMany({
		where: { subjectId: userId, isPseudonymized: false },
		data: { subjectId: hashedSubjectId, isPseudonymized: true },
	});

	return count;
}

/**
 * Full audit history for a user, newest first. Included in the Art. 15 data
 * export — audit rows about the user are themselves personal data.
 */
export async function getAuditLogForUser(userId: string) {
	return prisma.auditLog.findMany({
		where: { subjectId: userId },
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Deletes audit rows older than `cutoff` (Art. 5(1)(e) storage limitation —
 * an audit trail without a retention limit is itself a compliance gap).
 *
 * @returns The number of rows deleted.
 */
export async function purgeAuditLogsBefore(cutoff: Date): Promise<number> {
	const { count } = await prisma.auditLog.deleteMany({
		where: { createdAt: { lt: cutoff } },
	});

	return count;
}
