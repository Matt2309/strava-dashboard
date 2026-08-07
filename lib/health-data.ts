/**
 * Shared helpers for stripping health/biometric data (Art. 9 GDPR — special
 * category data) out of Strava payloads when a user has not granted (or has
 * revoked) the dedicated health data consent. See docs/gdpr-compliance-audit.md
 * § 3 gap #7.
 *
 * Covers both the parsed activity shape used internally (`average_heartrate`,
 * `suffer_score` — see `activitySchema` in lib/types.ts) and the extra keys
 * present in the raw, unparsed Strava API response served by the TOON export
 * (`getActivityToonExport` in server/services/strava.service.ts).
 */
export const HEALTH_DATA_KEYS = [
	"average_heartrate",
	"max_heartrate",
	"has_heartrate",
	"heartrate_opt_out",
	"display_hide_heartrate_option",
	"suffer_score",
] as const;

/**
 * Returns a shallow copy of `value` with every health data key removed.
 * Shallow is sufficient: all of the keys above are top-level fields in a
 * Strava activity payload.
 */
export function stripHealthDataKeys<T extends object>(value: T): T {
	const copy = { ...value } as Record<string, unknown>;
	for (const key of HEALTH_DATA_KEYS) {
		delete copy[key];
	}
	return copy as T;
}
