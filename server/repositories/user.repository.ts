import { prisma } from "@/lib/prisma";

/**
 * Collects a full snapshot of a user's personal data for a GDPR export
 * (Art. 15 Right of Access / Art. 20 Portability).
 *
 * OAuth credentials (accessToken, refreshToken, idToken, password) are
 * intentionally excluded from the `accounts` selection — they are
 * authentication secrets, not personal data the user needs back, and must
 * never be re-exported in a downloadable file. Sessions are excluded too:
 * they are ephemeral technical records, not something useful to the
 * data subject.
 *
 * Returns null if the user does not exist.
 */
export async function collectUserDataForExport(userId: string) {
	return prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			emailVerified: true,
			image: true,
			createdAt: true,
			updatedAt: true,
			privacyConsentTimestamp: true,
			termsConsentTimestamp: true,
			PrivacyPolicy: { select: { version: true, publishedAt: true } },
			TermsConditions: { select: { version: true, publishedAt: true } },
			accounts: {
				select: {
					providerId: true,
					accountId: true,
					scope: true,
					createdAt: true,
					updatedAt: true,
				},
			},
			Activity: true,
			GearFunctional: true,
			GearDevice: true,
			UserStatistics: true,
		},
	});
}

/**
 * Permanently deletes a user and, via Prisma `onDelete: Cascade`, every
 * related row (Session, Account, Activity, GearFunctional, GearDevice,
 * UserStatistics). Implements Art. 17 Right to Erasure.
 */
export async function deleteUserById(userId: string) {
	return prisma.user.delete({ where: { id: userId } });
}
