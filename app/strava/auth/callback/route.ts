import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// biome-ignore lint/style/useImportType: <explanation>
import { NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
        // Handle error
        redirect("/");
    }

    const response = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: env.STRAVA_CLIENT_ID,
            client_secret: env.STRAVA_CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
        }),
    });

    const data = await response.json();

    if (data.access_token) {
        // Await the cookies() Promise here
        const cookieStore = await cookies();

        cookieStore.set("strava_access_token", data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: new Date(data.expires_at * 1000),
        });

        cookieStore.set("strava_refresh_token", data.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
    }

    redirect("/");
}