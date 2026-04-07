import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { genericOAuth } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

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
	plugins: [
		genericOAuth({
			config: [
				{
					providerId: "strava",
					clientId: process.env.STRAVA_CLIENT_ID ?? "",
					clientSecret: process.env.STRAVA_CLIENT_SECRET ?? "",
					authorizationUrl: "https://www.strava.com/oauth/authorize",
					tokenUrl: "https://www.strava.com/oauth/token",
					scopes: ["read,activity:read,profile:read_all"],
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
