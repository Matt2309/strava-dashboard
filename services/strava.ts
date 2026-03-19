import { jsonToToon } from "@jojojoseph/toon-json-converter";
import { cookies } from "next/headers";
import { z } from "zod";
import { activitySchema } from "@/lib/types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

export class StravaAPIError extends Error {
	constructor(
		message: string,
		readonly statusCode: number,
	) {
		super(message);
		this.name = "StravaAPIError";
	}
}

async function getAccessToken() {
	// Await the cookies() Promise here too
	const cookieStore = await cookies();
	const accessToken = cookieStore.get("strava_access_token")?.value;

	if (!accessToken) {
		throw new StravaAPIError("Unauthorized", 401);
	}

	return accessToken;
}

interface FetchResponse<T> {
	ok: boolean;
	statusCode: number;
	data?: T;
	error?: string;
}

async function fetchStravaAPI<T = unknown>(path: string): Promise<FetchResponse<T>> {
	try {
		const accessToken = await getAccessToken();
		const response = await fetch(`${STRAVA_API_BASE}/${path}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				ok: false,
				statusCode: response.status,
				error: `Strava API request failed: ${response.statusText}`,
			};
		}

		return {
			ok: true,
			statusCode: response.status,
			data: data as T,
		};
	} catch (error) {
		if (error instanceof StravaAPIError) {
			return {
				ok: false,
				statusCode: error.statusCode,
				error: error.message,
			};
		}
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		return {
			ok: false,
			statusCode: 500,
			error: errorMessage,
		};
	}
}

export async function getActivities() {
	const response = await fetchStravaAPI<unknown[]>("athlete/activities");
	
	if (!response.ok) {
		throw new StravaAPIError(
			response.error || "Failed to fetch activities",
			response.statusCode,
		);
	}

	try {
		return z.array(activitySchema).parse(response.data);
	} catch (error) {
		const zodError = error instanceof z.ZodError
			? `Invalid activity data: ${error.message}`
			: "Failed to parse activity data";
		throw new StravaAPIError(zodError, 422);
	}
}

export async function getActivity(id: string) {
	const response = await fetchStravaAPI("activities/" + id);
	
	if (!response.ok) {
		throw new StravaAPIError(
			response.error || "Failed to fetch activity",
			response.statusCode,
		);
	}

	try {
		return activitySchema.parse(response.data);
	} catch (error) {
		const zodError = error instanceof z.ZodError
			? `Invalid activity data: ${error.message}`
			: "Failed to parse activity data";
		throw new StravaAPIError(zodError, 422);
	}
}

export async function getRawActivity(id: string) {
	const response = await fetchStravaAPI<Record<string, any>>("activities/" + id);
	
	if (!response.ok) {
		throw new StravaAPIError(response.error || "Failed to fetch activity", response.statusCode);
	}

	return response.data;
}

export async function exportActivityToToon(id: string) {
	const activity = await getRawActivity(id);
	if (!activity) {
		throw new StravaAPIError("Activity data is empty", 500);
	}
	return jsonToToon(activity as any);
}
