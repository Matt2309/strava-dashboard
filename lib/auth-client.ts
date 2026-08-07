"use client";

import {
	genericOAuthClient,
	twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ROUTES } from "@/lib/routes";

export const authClient = createAuthClient({
	baseURL:
		process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
		(typeof window !== "undefined" ? window.location.origin : ""),
	plugins: [
		genericOAuthClient(),
		// Fires whenever a sign-in response comes back as
		// `{ twoFactorRedirect: true }` instead of a session. A hard navigation
		// on purpose, not router.push: better-auth just deleted the session
		// cookie server-side and replaced it with a `two_factor` cookie, so
		// every RSC cache entry is stale.
		twoFactorClient({
			onTwoFactorRedirect() {
				window.location.href = ROUTES["two-factor"].path;
			},
		}),
	],
});

export const { signIn, signUp, signOut, useSession } = authClient;
