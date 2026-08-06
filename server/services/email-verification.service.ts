import { isDeliverableEmail } from "@/lib/email-address";
import { getEmailVerificationState } from "@/server/repositories/user.repository";

export type EmailVerificationRequirement = {
	required: boolean;
	email: string;
};

/**
 * Decides whether the soft verification wall (see
 * components/auth/email-verification-wall.tsx, rendered from
 * app/(app)/(user-app)/layout.tsx) must be shown to this user.
 *
 * `required` is true only when ALL of:
 * 1. `emailVerified` is false — nothing to do otherwise. Google users arrive
 *    with this already true (better-auth maps the ID token's
 *    `email_verified` claim); Strava users never do (see lib/auth.ts).
 * 2. The user has a `credential` (email/password) Account. Verification
 *    exists to prove the address belongs to whoever set *that* password —
 *    it is the credential-recovery anchor (/request-password-reset mails
 *    this address). A pure-OAuth account has no local credential to
 *    protect, so walling it buys nothing and risks a lockout: an athlete who
 *    grants Strava their real email still arrives with `emailVerified:
 *    false` hardcoded in lib/auth.ts#getUserInfo, and they never chose that
 *    address themselves. Note /reset-password *creates* a credential account
 *    for an OAuth-only user (better-auth's own behaviour) — reached via a
 *    link mailed to a deliverable address — so this predicate stays
 *    self-consistent once that happens.
 * 3. The address is actually deliverable. Backstop for condition 2: if a
 *    Strava user without a public email later sets a password, this keeps
 *    the wall from demanding proof of an address (`strava_<id>@strava.local`)
 *    that can never receive anything — a lockout that would otherwise be
 *    unescapable even via the wall's own "resend" button.
 */
export async function getEmailVerificationRequirement(
	userId: string,
): Promise<EmailVerificationRequirement> {
	const state = await getEmailVerificationState(userId);
	if (!state) return { required: false, email: "" };

	const required =
		!state.emailVerified &&
		state.hasCredentialAccount &&
		isDeliverableEmail(state.email);

	return { required, email: state.email };
}
