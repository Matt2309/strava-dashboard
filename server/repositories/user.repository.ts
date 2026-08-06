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

export type HealthDataConsentStatus = {
	/** false if the user has never made a decision — the Garage gate should show. */
	decided: boolean;
	granted: boolean;
	timestamp: Date | null;
};

/**
 * Art. 9 GDPR — separate consent for health/biometric data (heart rate,
 * suffer score). `healthDataConsent` is `null` until the user makes an
 * explicit choice in the Garage gate or the privacy settings page.
 */
export async function getHealthDataConsent(
	userId: string,
): Promise<HealthDataConsentStatus> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { healthDataConsent: true, healthDataConsentTimestamp: true },
	});

	if (!user) {
		throw new Error("User not found");
	}

	return {
		decided: user.healthDataConsent !== null,
		granted: user.healthDataConsent === true,
		timestamp: user.healthDataConsentTimestamp,
	};
}

/**
 * Records the user's explicit decision on health data consent. Called only
 * server-side from the compliance router — never trust a client-supplied
 * value beyond the boolean choice itself.
 */
export async function setHealthDataConsent(userId: string, granted: boolean) {
	return prisma.user.update({
		where: { id: userId },
		data: {
			healthDataConsent: granted,
			healthDataConsentTimestamp: new Date(),
		},
	});
}
