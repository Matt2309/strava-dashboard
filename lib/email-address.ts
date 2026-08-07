/**
 * Helpers around the one deliverability question this app actually needs to
 * answer: "can we send a real email to this address?" — used to gate both
 * the email-verification wall (server/services/email-verification.service.ts)
 * and the guard inside deliverVerificationEmail
 * (server/services/email.service.ts) that keeps Strava's synthetic addresses
 * away from Resend. Pure/no `server-only` on purpose: safe to import from
 * client components too (none currently do, but nothing here touches secrets).
 */

/**
 * Domain used for Strava athletes who withhold their email (see
 * lib/auth.ts#getUserInfo). Kept in exactly one place so the synthesis and
 * the exclusion check can never drift apart.
 */
export const STRAVA_SYNTHETIC_EMAIL_DOMAIN = "strava.local";

export function buildStravaSyntheticEmail(athleteId: string | number): string {
	return `strava_${athleteId}@${STRAVA_SYNTHETIC_EMAIL_DOMAIN}`;
}

/**
 * Reserved/non-routable TLDs (RFC 2606, RFC 6762) that can never resolve on
 * the public internet, plus the Strava synthetic domain above. An email
 * ending in one of these is guaranteed undeliverable — sending to it would
 * only produce a hard bounce and damage Resend sender reputation.
 */
const UNDELIVERABLE_DOMAINS = [
	STRAVA_SYNTHETIC_EMAIL_DOMAIN,
	"local",
	"localhost",
	"invalid",
	"test",
	"example",
	"example.com",
	"example.net",
	"example.org",
];

export function isDeliverableEmail(email: string): boolean {
	const atIndex = email.lastIndexOf("@");
	if (atIndex <= 0 || atIndex === email.length - 1) return false;

	const domain = email.slice(atIndex + 1).toLowerCase();
	return !UNDELIVERABLE_DOMAINS.some(
		(reserved) => domain === reserved || domain.endsWith(`.${reserved}`),
	);
}
