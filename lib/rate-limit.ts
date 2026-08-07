import "server-only";

/**
 * Minimal in-memory fixed-window rate limiter, mirroring the semantics of
 * better-auth's own `memory` rate-limit storage (see lib/auth.ts). Used to
 * cover /api/rpc, which sits outside better-auth's perimeter but is where
 * all personal-data access (export, delete account, activities) goes
 * through — GDPR audit gap #6 (docs/gdpr-compliance-audit.md § 6.1).
 *
 * Deliberately not persisted to a DB: no IP/session data outlives the
 * process, which keeps this aligned with data-minimization instead of
 * adding a table of client identifiers with no expiry.
 */

type Entry = {
	count: number;
	resetAt: number;
};

const buckets = new Map<string, Entry>();

// Cheap backstop against unbounded growth from a flood of distinct keys
// (e.g. spoofed IPs). Swept lazily on writes once the map gets large.
const MAX_BUCKETS = 10_000;

function sweepExpired(now: number) {
	for (const [key, entry] of buckets) {
		if (entry.resetAt <= now) buckets.delete(key);
	}
}

export function consumeRateLimit(
	key: string,
	max: number,
	windowSeconds: number,
): { allowed: boolean; retryAfter: number } {
	const now = Date.now();
	const entry = buckets.get(key);

	if (!entry || entry.resetAt <= now) {
		if (buckets.size >= MAX_BUCKETS) sweepExpired(now);
		buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
		return { allowed: true, retryAfter: 0 };
	}

	if (entry.count >= max) {
		return {
			allowed: false,
			retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
		};
	}

	entry.count += 1;
	return { allowed: true, retryAfter: 0 };
}

/**
 * Resolves the client IP the same way lib/auth.ts's `advanced.ipAddress`
 * config does, so both rate limiters agree on the deploy chain
 * (client -> Cloudflare -> reverse proxy -> container).
 */
export function getClientIp(request: Request): string | null {
	for (const header of ["cf-connecting-ip", "x-forwarded-for"]) {
		const value = request.headers.get(header);
		if (value) {
			const ip = value.split(",")[0]?.trim();
			if (ip) return ip;
		}
	}
	return null;
}

type AuthRateLimitRecord = {
	key: string;
	count: number;
	lastRequest: number;
};

const MAX_AUTH_RATE_LIMIT_ENTRIES = 10_000;

/**
 * better-auth's own built-in `memory` rate-limit storage keeps its Map
 * unbounded — an entry is only evicted when its own key is read again after
 * expiry, so a flood of one-off keys (e.g. spoofed IPs never reused) just
 * accumulates forever. This bounded store plugs in as `rateLimit.customStorage`
 * (see lib/auth.ts) to cap that growth: re-touching a key moves it to the end
 * of the Map's insertion order, so once the cap is hit we evict the
 * least-recently-touched entry first — real, repeat clients survive, one-off
 * noise doesn't.
 */
function createBoundedAuthRateLimitStorage(maxEntries: number) {
	const store = new Map<string, AuthRateLimitRecord>();

	return {
		async get(key: string): Promise<AuthRateLimitRecord | null> {
			return store.get(key) ?? null;
		},
		async set(key: string, value: AuthRateLimitRecord): Promise<void> {
			store.delete(key);
			store.set(key, value);
			if (store.size > maxEntries) {
				const oldestKey = store.keys().next().value;
				if (oldestKey !== undefined) store.delete(oldestKey);
			}
		},
	};
}

export const authRateLimitStorage = createBoundedAuthRateLimitStorage(
	MAX_AUTH_RATE_LIMIT_ENTRIES,
);
