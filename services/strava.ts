import { z } from "zod";
import { cookies } from "next/headers";
import { activitySchema } from "@/lib/types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

async function getAccessToken() {
    // Await the cookies() Promise here too
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value;

    if (!accessToken) {
        throw new Error("Unauthorized");
    }

    return accessToken;
}

async function fetchStravaAPI(path: string) {
    const accessToken = await getAccessToken();
    const response = await fetch(`${STRAVA_API_BASE}/${path}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Strava API request failed: ${response.statusText}`);
    }

    return response.json();
}

export async function getActivities() {
  const data = await fetchStravaAPI("athlete/activities");
  console.log(data)
  return z.array(activitySchema).parse(data);
}

export async function getActivity(id: string) {
  const data = await fetchStravaAPI(`activities/${id}`);
  return activitySchema.parse(data);
}

export async function exportActivityToToon(id: string) {
  const activity = await getActivity(id);
  // A real implementation would convert the activity to TOON format.
  // For now, we'll just return the JSON as a string.
  return JSON.stringify(activity, null, 2);
}
