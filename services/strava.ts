import { type JsonValue, jsonToToon } from "@jojojoseph/toon-json-converter";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        throw new StravaAPIError("Unauthorized", 401);
    }

    const account = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            providerId: "strava",
        },
    });

    if (!account?.accessToken || !account.refreshToken) {
        throw new StravaAPIError("Strava account not connected", 401);
    }

    if (
        account.accessTokenExpiresAt &&
        account.accessTokenExpiresAt > new Date()
    ) {
        return account.accessToken;
    }

    // REFRESH TOKEN
    const response = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: account.refreshToken,
        }),
    });

    if (!response.ok) {
        throw new StravaAPIError("Failed to refresh Strava token", 401);
    }

    const data = await response.json();

    // update DB
    await prisma.account.update({
        where: { id: account.id },
        data: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpiresAt: new Date(data.expires_at * 1000),
        },
    });

    return data.access_token;
}

interface FetchResponse<T> {
	ok: boolean;
	statusCode: number;
	data?: T;
	error?: string;
}

async function fetchStravaAPI<T = unknown>(
	path: string,
): Promise<FetchResponse<T>> {
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
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
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
		const zodError =
			error instanceof z.ZodError
				? `Invalid activity data: ${error.message}`
				: "Failed to parse activity data";
		throw new StravaAPIError(zodError, 422);
	}
}

export async function getActivity(id: string) {
	const response = await fetchStravaAPI(`activities/${id}`);

	if (!response.ok) {
		throw new StravaAPIError(
			response.error || "Failed to fetch activity",
			response.statusCode,
		);
	}

	try {
		return activitySchema.parse(response.data);
	} catch (error) {
		const zodError =
			error instanceof z.ZodError
				? `Invalid activity data: ${error.message}`
				: "Failed to parse activity data";
		throw new StravaAPIError(zodError, 422);
	}
}

export async function getRawActivity(id: string) {
	const response = await fetchStravaAPI<JsonValue>(`activities/${id}`);

	if (!response.ok) {
		throw new StravaAPIError(
			response.error || "Failed to fetch activity",
			response.statusCode,
		);
	}

	return response.data;
}

export async function exportActivityToToon(id: string) {
	const activity = await getRawActivity(id);
	if (!activity) {
		throw new StravaAPIError("Activity data is empty", 500);
	}
	return jsonToToon(activity);
}
