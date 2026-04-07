export type RouteName =
	| "home"
	| "garage"
	| "login"
	| "register"
	| "activity-detail";

export type ApiRouteName = "auth" | "rpc" | "strava-webhook";

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
	garage: {
		path: "/garage",
		access: RouteAccess.PRIVATE,
	},
	"activity-detail": {
		path: "/activity/:id",
		access: RouteAccess.PRIVATE,
		build: (id: string) => `/activity/${id}`,
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
} as const satisfies Record<ApiRouteName, ApiRoute>;

/**
 * Returns an array of paths for routes that are PROTECTED (auth pages).
 * Used in middleware to determine public routes.
 */
export const getProtectedRoutes = (): string[] =>
	Object.values(ROUTES)
		.filter((r) => r.access === RouteAccess.PROTECTED)
		.map((r) => r.path);
