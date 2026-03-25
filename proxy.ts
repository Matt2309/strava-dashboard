import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
	// --- 1. BYPASS PER I WEBHOOK E LE API ESTERNE ---
	// Se la chiamata arriva da Strava, lasciala passare immediatamente
	// senza controllare le sessioni o fare fetch interni.
	if (request.nextUrl.pathname.startsWith("/api/strava/webhook")) {
		return NextResponse.next();
	}

	// 2. Definisci le rotte pubbliche che non richiedono login
	const publicRoutes = ["/login", "/register"];
	const isPublicRoute = publicRoutes.some((route) =>
		request.nextUrl.pathname.startsWith(route),
	);

	const baseURL = process.env.INTERNAL_FETCH_URL || request.nextUrl.origin;

	// Inserisci un try/catch per evitare crash futuri se il fetch fallisce
	let session: Session | null = null;
	try {
		const { data } = await betterFetch<Session>("/api/auth/get-session", {
			baseURL,
			headers: {
				cookie: request.headers.get("cookie") || "",
			},
		});
		session = data;
	} catch (error) {
		console.error("Errore fetch sessione nel proxy:", error);
	}

	// 3. Logica di reindirizzamento
	if (!session && !isPublicRoute) {
		// Utente non loggato cerca di accedere a una pagina privata -> via al login
		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (session && isPublicRoute) {
		// Utente già loggato cerca di accedere a /login -> via alla dashboard
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

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
		"/((?!api/auth|api/strava/webhook|_next/static|_next/image|favicon.ico).*)",
	],
};
