import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/server/repositories/audit-log.repository";
import { getLatestPolicy } from "@/server/repositories/policy.repository";
import { getLatestTerms } from "@/server/repositories/terms.repository";

export type LegalDocumentStatus = {
	needed: boolean;
	firstTime: boolean;
};

export type LegalConsentStatus = {
	policy: LegalDocumentStatus;
	terms: LegalDocumentStatus;
};

/**
 * Determine whether a user still needs to accept the active privacy policy
 * and/or terms & conditions, and whether this would be their first-ever
 * acceptance of that document (vs. re-accepting after a version update).
 */
export async function getUserLegalConsentStatus(
	userId: string,
): Promise<LegalConsentStatus> {
	const [user, activePolicy, activeTerms] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				privacyPolicyId: true,
				privacyConsentTimestamp: true,
				termsConditionsId: true,
				termsConsentTimestamp: true,
			},
		}),
		getLatestPolicy(),
		getLatestTerms(),
	]);

	if (!user) {
		throw new Error("User not found");
	}

	return {
		policy: {
			needed: activePolicy !== null && user.privacyPolicyId !== activePolicy.id,
			firstTime: user.privacyConsentTimestamp === null,
		},
		terms: {
			needed: activeTerms !== null && user.termsConditionsId !== activeTerms.id,
			firstTime: user.termsConsentTimestamp === null,
		},
	};
}

export type LegalConsentDocuments = {
	policy?: { id: string; version: string };
	terms?: { id: string; version: string };
};

/**
 * Records acceptance of the privacy policy and/or terms & conditions
 * together with the corresponding audit event, in a single transaction —
 * the consent write and its proof must succeed or fail together (GDPR audit
 * gap #12: overwriting the timestamp with no audit trail meant a prior
 * acceptance, e.g. of v1, was lost the moment v2 was accepted).
 */
export async function recordLegalConsent(
	userId: string,
	documents: LegalConsentDocuments,
): Promise<void> {
	await prisma.$transaction(async (tx) => {
		if (documents.policy) {
			await tx.user.update({
				where: { id: userId },
				data: {
					privacyPolicyId: documents.policy.id,
					privacyConsentTimestamp: new Date(),
				},
			});
			await recordAuditEvent(
				{
					subjectId: userId,
					action: "POLICY_ACCEPTED",
					metadata: {
						documentId: documents.policy.id,
						version: documents.policy.version,
					},
				},
				tx,
			);
		}

		if (documents.terms) {
			await tx.user.update({
				where: { id: userId },
				data: {
					termsConditionsId: documents.terms.id,
					termsConsentTimestamp: new Date(),
				},
			});
			await recordAuditEvent(
				{
					subjectId: userId,
					action: "TERMS_ACCEPTED",
					metadata: {
						documentId: documents.terms.id,
						version: documents.terms.version,
					},
				},
				tx,
			);
		}
	});
}
