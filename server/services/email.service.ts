import { isDeliverableEmail } from "@/lib/email-address";
import { sendEmail } from "@/server/infrastructure/email.client";
import {
	renderResetPassword,
	renderVerifyEmail,
} from "@/server/infrastructure/email.templates";
import { recordAuditEventSafe } from "@/server/services/audit.service";

type EmailUser = { id: string; name: string; email: string };

const VERIFICATION_EXPIRES_IN_MINUTES = 60 * 24; // matches emailVerification.expiresIn in lib/auth.ts
const RESET_PASSWORD_EXPIRES_IN_MINUTES = 60; // matches emailAndPassword.resetPasswordTokenExpiresIn in lib/auth.ts

/**
 * Art. 32 GDPR — proof that the address a user registered with is actually
 * theirs, gating the soft verification wall (see
 * server/services/email-verification.service.ts and
 * docs/gdpr-compliance-audit.md).
 *
 * Short-circuits on an undeliverable address instead of calling Resend. This
 * is the guard that matters most: better-auth's OAuth link-account flow
 * calls `sendVerificationEmail` for any newly created OAuth user whose
 * `emailVerified` is false — and lib/auth.ts's Strava `getUserInfo`
 * synthesizes `strava_<id>@strava.local` for athletes who withhold their
 * email. Without this check, every Strava-first signup without a public
 * email would hand Resend an address that hard-bounces on arrival.
 */
export async function deliverVerificationEmail(
	user: EmailUser,
	url: string,
): Promise<void> {
	if (!isDeliverableEmail(user.email)) return;

	const { subject, html, text } = renderVerifyEmail({
		name: user.name,
		url,
		expiresInMinutes: VERIFICATION_EXPIRES_IN_MINUTES,
	});

	await sendEmail({ to: user.email, subject, html, text });
}

/**
 * Art. 32 GDPR — credential-recovery path. better-auth only invokes this
 * callback when the account actually exists (the not-found branch of
 * /request-password-reset returns early after a dummy lookup, to keep
 * response timing/shape identical either way — see lib/auth.ts's
 * `advanced.backgroundTasks.handler`), so a PASSWORD_RESET_REQUESTED row can
 * never be created by probing a non-existent address.
 */
export async function deliverPasswordResetEmail(
	user: EmailUser,
	url: string,
): Promise<void> {
	const { subject, html, text } = renderResetPassword({
		name: user.name,
		url,
		expiresInMinutes: RESET_PASSWORD_EXPIRES_IN_MINUTES,
	});

	const result = await sendEmail({ to: user.email, subject, html, text });

	// Bare boolean, no personal data — the only forensic record available if
	// Resend was down when a reset was requested (AuditLog.metadata contract,
	// prisma/schema.prisma).
	await recordAuditEventSafe({
		subjectId: user.id,
		action: "PASSWORD_RESET_REQUESTED",
		metadata: { emailDelivered: result.ok },
	});
}
