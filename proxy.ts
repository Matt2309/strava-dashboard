import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
	// 1. Definisci le rotte pubbliche che non richiedono login
	const publicRoutes = ["/login", "/register"];
	const isPublicRoute = publicRoutes.some((route) =>
		request.nextUrl.pathname.startsWith(route),
	);

    const baseURL = process.env.INTERNAL_FETCH_URL || request.nextUrl.origin;
    const { data: session } = await betterFetch<Session>(
        "/api/auth/get-session",
        {
            baseURL,
			headers: {
				// Fondamentale: passa i cookie della richiesta originale
				cookie: request.headers.get("cookie") || "",
			},
		},
	);

	// 3. Logica di reindirizzamento
	if (!session && !isPublicRoute) {
		// Utente non loggato cerca di accedere a una pagina privata -> via al login
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (session && isPublicRoute) {
		// Utente già loggato cerca di accedere a /login -> via alla dashboard
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

// 4. Configura il matcher per non intercettare file statici e immagini
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api/auth (auth endpoints)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
	],
};
