import { prisma } from "@/lib/prisma";
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
