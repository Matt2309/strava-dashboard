import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { genericOAuth } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { authRateLimitStorage } from "@/lib/rate-limit";

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		},
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["strava"],
			allowDifferentEmails: true,
		},
	},
	advanced: {
		ipAddress: {
			// Deploy chain: client -> Cloudflare -> reverse proxy -> container.
			// `cf-connecting-ip` is set by Cloudflare and can't be spoofed by the
			// client as long as the origin only accepts traffic from Cloudflare.
			// `x-forwarded-for` is the reverse-proxy fallback; the proxy must
			// OVERWRITE it with the real client IP (not append), otherwise a
			// client can forge it and dodge the rate limit below.
			ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
		},
	},
	// GDPR audit gap #6 (docs/gdpr-compliance-audit.md § 6.1): brute-force
	// protection on auth endpoints (Art. 32 GDPR — appropriate technical
	// measures). Explicit here so it doesn't silently depend on NODE_ENV.
	rateLimit: {
		enabled: true,
		// `customStorage` overrides `storage` entirely — this is a Map-backed
		// store like "memory", but capped (see lib/rate-limit.ts) so a flood of
		// one-off keys can't grow it without bound.
		customStorage: authRateLimitStorage,
		window: 60,
		max: 100,
		customRules: {
			"/sign-in/email": { window: 60, max: 5 },
			"/sign-up/email": { window: 300, max: 5 },
			"/sign-in/social": { window: 60, max: 10 },
			"/sign-in/oauth2": { window: 60, max: 10 },
			// Called on every useSession() — must stay generous or the app
			// self-DoSes on normal navigation.
			"/get-session": { window: 60, max: 300 },
		},
	},
	user: {
		additionalFields: {
			// These are only ever written server-side by the compliance router
			// (see routers/compliance.ts, acceptLegalDocuments), after the user
			// explicitly accepts via the register form or the post-login consent wall.
			// `input: false` prevents a client from self-certifying consent through signUp.
			privacyConsentTimestamp: {
				type: "date",
				required: false,
				input: false,
			},
			privacyPolicyId: {
				type: "string",
				required: false,
				input: false,
			},
			termsConsentTimestamp: {
				type: "date",
				required: false,
				input: false,
			},
			termsConditionsId: {
				type: "string",
				required: false,
				input: false,
			},
			// Art. 9 GDPR — health data consent (heart rate, suffer score), only
			// ever written server-side by the compliance router (see
			// routers/compliance.ts, setHealthDataConsent), after the user
			// decides in the Garage gate or the privacy settings page.
			// `input: false` prevents a client from self-certifying this via signUp.
			healthDataConsent: {
				type: "boolean",
				required: false,
				input: false,
			},
			healthDataConsentTimestamp: {
				type: "date",
				required: false,
				input: false,
			},
		},
	},
	plugins: [
		genericOAuth({
			config: [
				{
					providerId: "strava",
					clientId: process.env.STRAVA_CLIENT_ID ?? "",
					clientSecret: process.env.STRAVA_CLIENT_SECRET ?? "",
					authorizationUrl: "https://www.strava.com/oauth/authorize",
					tokenUrl: "https://www.strava.com/oauth/token",
					scopes: ["read,activity:read_all,profile:read_all"],
					authorizationUrlParams: {
						approval_prompt: "auto",
					},
					getUserInfo: async (tokens) => {
						const response = await fetch(
							"https://www.strava.com/api/v3/athlete",
							{
								headers: {
									Authorization: `Bearer ${tokens.accessToken}`,
								},
							},
						);

						if (!response.ok) return null;

						const athlete = (await response.json()) as {
							id: number;
							firstname: string;
							lastname: string;
							email?: string;
							profile?: string;
						};

						return {
							id: String(athlete.id),
							name: `${athlete.firstname} ${athlete.lastname}`.trim(),
							email: athlete.email ?? `strava_${athlete.id}@strava.local`,
							image: athlete.profile ?? undefined,
							emailVerified: false,
						};
					},
				},
			],
		}),
	],
});
