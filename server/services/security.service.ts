import { prisma } from "@/lib/prisma";
import { hasCredentialAccount } from "@/server/repositories/user.repository";

export type TwoFactorStatus = {
	enabled: boolean;
	/**
	 * False for OAuth-only accounts (Google/Strava, no `credential` Account
	 * row) — better-auth's /two-factor/enable, /disable and
	 * /generate-backup-codes all require the account password, so 2FA is
	 * unreachable until the user gains one (e.g. via /forgot-password).
	 */
	hasPassword: boolean;
};

/**
 * GDPR audit gap #11 — current 2FA enrolment status for the settings page
 * (components/settings/two-factor-card.tsx). `hasPassword` is what decides
 * whether the "Attiva 2FA" action is even shown: calling the enable endpoint
 * without a password would surface a misleading "invalid password" error for
 * a password the user never set.
 */
export async function getTwoFactorStatus(
	userId: string,
): Promise<TwoFactorStatus> {
	const [user, hasPassword] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: { twoFactorEnabled: true },
		}),
		hasCredentialAccount(userId),
	]);

	return {
		enabled: user?.twoFactorEnabled ?? false,
		hasPassword,
	};
}
