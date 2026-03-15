import { z } from "zod";

const envSchema = z.object({
	STRAVA_CLIENT_ID: z.string(),
	STRAVA_CLIENT_SECRET: z.string(),
	STRAVA_REDIRECT_URI: z.string().url(),
});

export const env = envSchema.parse(process.env);
