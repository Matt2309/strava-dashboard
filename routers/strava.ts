import { os } from "@orpc/server";
import { z } from "zod";
import { env } from "@/lib/env";
import * as strava from "@/services";

export const getAuthUrl = os
	.handler(() => {
		const params = new URLSearchParams({
			client_id: env.STRAVA_CLIENT_ID,
			redirect_uri: env.STRAVA_REDIRECT_URI,
			response_type: "code",
			scope: "read,activity:read_all",
			approval_prompt: "auto",
		});
		return `https://www.strava.com/oauth/authorize?${params.toString()}`;
	})
	.callable();

export const getActivities = os
	.handler(async () => {
		return await strava.getActivities();
	})
	.callable();

export const getActivity = os
	.input(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		return await strava.getActivity(input.id);
	})
	.callable();

export const exportToToon = os
	.input(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		return await strava.exportActivityToToon(input.id);
	})
	.callable();

export const stravaRouter = os.router({
	getAuthUrl,
	getActivities,
	getActivity,
	exportToToon,
});
