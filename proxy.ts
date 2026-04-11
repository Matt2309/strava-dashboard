import { type NextRequest, NextResponse } from "next/server";
import { API_ROUTES, RouteAccess, ROUTES } from "@/lib/routes";
import { match } from "path-to-regexp";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const proxy = async (request: NextRequest) => {
	const { pathname } = new URL(request.url);
	// --- 1. BYPASS PER I WEBHOOK E LE API ESTERNE ---
	// Se la chiamata arriva da Strava, lasciala passare immediatamente
	// senza controllare le sessioni o fare fetch interni.
	if (request.nextUrl.pathname.startsWith(API_ROUTES["strava-webhook"].path)) {
		return NextResponse.next();
	}

	const matchedRoute = Object.values(ROUTES).find((route) => {
		const matcher = match(route.path, {
			decode: decodeURIComponent,
		});

		return matcher(pathname);
	});

	if (!matchedRoute) {
		return NextResponse.rewrite(new URL(ROUTES["not-found"].path, request.url));
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const accessType = matchedRoute.access;

	if (accessType === RouteAccess.PRIVATE && !session) {
		return NextResponse.redirect(new URL(ROUTES.login.path, request.url));
	}

	if (accessType === RouteAccess.PROTECTED && session) {
		return NextResponse.redirect(new URL(ROUTES.home.path, request.url));
	}
};

// 4. Configura il matcher
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api/auth (auth endpoints)
		 * - api/strava/webhook (AGGIUNTO: esclude il webhook direttamente alla radice)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api/auth|api/strava/webhook||api/rpc|_next/static|_next/image|favicon.ico).*)",
	],
};
