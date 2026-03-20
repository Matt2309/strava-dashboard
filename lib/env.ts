import { z } from "zod";

const envSchema = z.object({
	STRAVA_CLIENT_ID: z.string(),
	STRAVA_CLIENT_SECRET: z.string(),
	BETTER_AUTH_SECRET: z.string(),
	BETTER_AUTH_URL: z.string().url(),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
