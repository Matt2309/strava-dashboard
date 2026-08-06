import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/server/repositories/audit-log.repository";

/**
 * Collects a full snapshot of a user's personal data for a GDPR export
 * (Art. 15 Right of Access / Art. 20 Portability).
 *
 * OAuth credentials (accessToken, refreshToken, idToken, password) are
 * intentionally excluded from the `accounts` selection — they are
 * authentication secrets, not personal data the user needs back, and must
 * never be re-exported in a downloadable file. Sessions are excluded too:
 * they are ephemeral technical records, not something useful to the
 * data subject. The `TwoFactor` relation (encrypted TOTP secret + backup
 * codes) is excluded for the same reason as `password` — it's a credential,
 * not data the user needs back — while `twoFactorEnabled` (a plain boolean)
 * IS included below, since knowing whether 2FA is on is meaningful to the
 * data subject and carries no secret.
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
			twoFactorEnabled: true,
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
 * UserStatistics, TwoFactor). Implements Art. 17 Right to Erasure.
 *
 * `Verification` rows are deleted explicitly first: better-auth's 2FA
 * "trust this device" cookie and its 10-minute 2FA challenge cookie are both
 * stored there keyed by `value = userId`, and — unlike every other table
 * that carries a userId — `Verification` has no FK to `User`, so it would
 * otherwise survive account deletion holding a deleted user's id for up to
 * 30 days (see prisma/schema.prisma).
 */
export async function deleteUserById(userId: string) {
	return prisma.$transaction(async (tx) => {
		await tx.verification.deleteMany({ where: { value: userId } });
		return tx.user.delete({ where: { id: userId } });
	});
}

export type EmailVerificationState = {
	email: string;
	emailVerified: boolean;
	hasCredentialAccount: boolean;
};

/**
 * Raw facts needed to decide whether the email-verification wall applies to
 * this user (see server/services/email-verification.service.ts for the
 * predicate). `hasCredentialAccount` is true only if the user has an
 * email/password `Account` row — the wall only applies to accounts that
 * actually have a password to protect.
 */
export async function getEmailVerificationState(
	userId: string,
): Promise<EmailVerificationState | null> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			email: true,
			emailVerified: true,
			accounts: {
				where: { providerId: "credential" },
				select: { id: true },
				take: 1,
			},
		},
	});

	if (!user) return null;

	return {
		email: user.email,
		emailVerified: user.emailVerified,
		hasCredentialAccount: user.accounts.length > 0,
	};
}

/**
 * True when the user signed up with (or later gained, e.g. via
 * /forgot-password) an email/password credential. better-auth's
 * /two-factor/enable, /disable and /generate-backup-codes all require the
 * account password, so an OAuth-only user (no `credential` Account row)
 * cannot use 2FA at all — see components/settings/two-factor-card.tsx.
 */
export async function hasCredentialAccount(userId: string): Promise<boolean> {
	const account = await prisma.account.findFirst({
		where: { userId, providerId: "credential", password: { not: null } },
		select: { id: true },
	});
	return account !== null;
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
 *
 * The update and its audit event are written in the same transaction: a
 * consent decision recorded without proof of when/what was decided is worse
 * than no consent decision at all (GDPR audit gap #12).
 */
export async function setHealthDataConsent(userId: string, granted: boolean) {
	return prisma.$transaction(async (tx) => {
		const user = await tx.user.update({
			where: { id: userId },
			data: {
				healthDataConsent: granted,
				healthDataConsentTimestamp: new Date(),
			},
		});

		await recordAuditEvent(
			{
				subjectId: userId,
				action: granted
					? "HEALTH_DATA_CONSENT_GRANTED"
					: "HEALTH_DATA_CONSENT_REVOKED",
			},
			tx,
		);

		return user;
	});
}
