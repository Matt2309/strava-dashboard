import { prisma } from "@/lib/prisma";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

export class StravaClientError extends Error {
	constructor(
		message: string,
		readonly statusCode: number,
	) {
		super(message);
		this.name = "StravaClientError";
	}
}

/**
 * Retrieves a valid access token for the given user, refreshing it if expired.
 * Unlike the session-based token getter in services/strava.ts, this function
 * operates purely on userId so it can be called from webhook handlers where
 * there is no active HTTP session.
 */
async function getAccessTokenForUser(userId: string): Promise<string> {
	const account = await prisma.account.findFirst({
		where: { userId, providerId: "strava" },
	});

	if (!account?.accessToken || !account.refreshToken) {
		throw new StravaClientError("Strava account not connected", 401);
	}

	if (
		account.accessTokenExpiresAt &&
		account.accessTokenExpiresAt > new Date()
	) {
		return account.accessToken;
	}

	// Token expired — refresh it
	const response = await fetch("https://www.strava.com/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: JSON.stringify({
			client_id: process.env.STRAVA_CLIENT_ID,
			client_secret: process.env.STRAVA_CLIENT_SECRET,
			grant_type: "refresh_token",
			refresh_token: account.refreshToken,
		}),
	});

	if (!response.ok) {
		throw new StravaClientError("Failed to refresh Strava token", 401);
	}

	const data = (await response.json()) as {
		access_token: string;
		refresh_token: string;
		expires_at: number;
	};

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

export interface StravaFetchResult<T> {
	ok: boolean;
	statusCode: number;
	data?: T;
	error?: string;
}

/**
 * Makes an authenticated request to the Strava API on behalf of a user.
 * Handles token refresh transparently.
 */
export async function fetchStravaForUser<T = unknown>(
	userId: string,
	path: string,
): Promise<StravaFetchResult<T>> {
	try {
		const accessToken = await getAccessTokenForUser(userId);
		const response = await fetch(`${STRAVA_API_BASE}/${path}`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});

		const data = (await response.json()) as T;

		if (!response.ok) {
			return {
				ok: false,
				statusCode: response.status,
				error: `Strava API request failed: ${response.statusText}`,
			};
		}

		return { ok: true, statusCode: response.status, data };
	} catch (error) {
		if (error instanceof StravaClientError) {
			return { ok: false, statusCode: error.statusCode, error: error.message };
		}
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return { ok: false, statusCode: 500, error: errorMessage };
	}
}

/**
 * Retrieves the Strava athlete ID (accountId) for a given internal user ID.
 */
export async function getStravaAthleteId(
	userId: string,
): Promise<string | null> {
	const account = await prisma.account.findFirst({
		where: { userId, providerId: "strava" },
		select: { accountId: true },
	});
	return account?.accountId ?? null;
}

/**
 * Looks up the internal userId for a Strava athlete ID.
 */
export async function getUserIdByStravaAthleteId(
	stravaAthleteId: string,
): Promise<string | null> {
	const account = await prisma.account.findFirst({
		where: { accountId: stravaAthleteId, providerId: "strava" },
		select: { userId: true },
	});
	return account?.userId ?? null;
}
