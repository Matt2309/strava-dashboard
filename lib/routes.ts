export type RouteName =
	| "home"
	| "garage"
	| "login"
	| "register"
	| "forgot-password"
	| "reset-password"
	| "two-factor"
	| "activity-detail"
	| "privacy-policy"
	| "terms-conditions"
	| "privacy-settings"
	| "account-settings"
	| "engine-room"
	| "plan-create"
	| "plan-edit"
	| "plan-detail"
	| "workout"
	| "workout-summary"
	| "not-found";

export type ApiRouteName = "auth" | "rpc" | "strava-webhook" | "cron-purge";

export enum RouteAccess {
	PUBLIC,
	PROTECTED, // Accessible only when NOT logged in (auth pages)
	PRIVATE, // Requires authentication
}

export type StaticRoute = {
	path: string;
	access: RouteAccess;
};

export type DynamicRoute = StaticRoute & {
	build: (...values: string[]) => string;
};

export type RouteConfig = StaticRoute | DynamicRoute;

export type ApiRoute = {
	path: string;
	pattern?: string; // For matching in middleware
};

export const ROUTES = {
	home: {
		path: "/",
		access: RouteAccess.PRIVATE,
	},
	login: {
		path: "/login",
		access: RouteAccess.PROTECTED,
	},
	register: {
		path: "/register",
		access: RouteAccess.PROTECTED,
	},
	"forgot-password": {
		path: "/forgot-password",
		access: RouteAccess.PROTECTED,
	},
	// PUBLIC, not PROTECTED — and the distinction is load-bearing. The token
	// in the URL is the credential here, not the session: a user can click
	// the emailed link while still logged in on that device (the common case
	// — password forgotten on the phone, session still alive on the laptop).
	// PROTECTED would bounce them straight back to "/" before they could
	// complete the reset. `revokeSessionsOnPasswordReset` in lib/auth.ts kills
	// the stale session as part of the reset itself.
	"reset-password": {
		path: "/reset-password",
		access: RouteAccess.PUBLIC,
	},
	// Reached mid sign-in, after email/password credentials were accepted but
	// before the second factor is provided. At that point better-auth has
	// already deleted the session it briefly created and replaced the cookie
	// with a short-lived `two_factor` cookie — so there is no session, and
	// PROTECTED (which only redirects when a real session exists) lets the
	// page through while still correctly bouncing an already-signed-in user.
	"two-factor": {
		path: "/two-factor",
		access: RouteAccess.PROTECTED,
	},
	garage: {
		path: "/garage",
		access: RouteAccess.PRIVATE,
	},
	"activity-detail": {
		path: "/garage/activity/:id",
		access: RouteAccess.PRIVATE,
		build: (id: string) => `/garage/activity/${id}`,
	},
	"engine-room": {
		path: "/engine-room",
		access: RouteAccess.PRIVATE,
	},
	// Declared BEFORE "plan-detail": proxy.ts picks the FIRST ROUTES entry
	// whose path-to-regexp pattern matches, and "/engine-room/:planId" would
	// otherwise also match "/engine-room/create" (both are 2 segments, and
	// ":planId" matches any literal segment including "create"). Both are
	// PRIVATE today so the access decision happens to be identical either
	// way — but the ordering is load-bearing the moment the two diverge.
	"plan-create": {
		path: "/engine-room/create",
		access: RouteAccess.PRIVATE,
	},
	"plan-edit": {
		path: "/engine-room/:planId/edit",
		access: RouteAccess.PRIVATE,
		build: (planId: string) => `/engine-room/${planId}/edit`,
	},
	"plan-detail": {
		path: "/engine-room/:planId",
		access: RouteAccess.PRIVATE,
		build: (planId: string) => `/engine-room/${planId}`,
	},
	workout: {
		path: "/engine-room/workout/:dayId",
		access: RouteAccess.PRIVATE,
		build: (dayId: string) => `/engine-room/workout/${dayId}`,
	},
	"workout-summary": {
		path: "/engine-room/session/:sessionId",
		access: RouteAccess.PRIVATE,
		build: (sessionId: string) => `/engine-room/session/${sessionId}`,
	},
	"privacy-policy": {
		path: "/privacy-policy",
		access: RouteAccess.PUBLIC,
	},
	"terms-conditions": {
		path: "/terms-conditions",
		access: RouteAccess.PUBLIC,
	},
	"privacy-settings": {
		path: "/settings/privacy",
		access: RouteAccess.PRIVATE,
	},
	"account-settings": {
		path: "/settings/account",
		access: RouteAccess.PRIVATE,
	},
	"not-found": {
		path: "/not-found",
		access: RouteAccess.PUBLIC,
	},
} as const satisfies Record<RouteName, RouteConfig>;

export const API_ROUTES = {
	auth: {
		path: "/api/auth",
		pattern: "/api/auth/*",
	},
	rpc: {
		path: "/api/rpc",
		pattern: "/api/rpc/*",
	},
	"strava-webhook": {
		path: "/api/strava/webhook",
	},
	"cron-purge": {
		path: "/api/cron/purge-raw-data",
	},
} as const satisfies Record<ApiRouteName, ApiRoute>;

/**
 * Returns an array of paths for routes that are PROTECTED (auth pages).
 * Used in middleware to determine public routes.
 */
export const getProtectedRoutes = (): string[] =>
	Object.values(ROUTES)
		.filter((r) => r.access === RouteAccess.PROTECTED)
		.map((r) => r.path);
