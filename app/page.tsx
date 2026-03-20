import { headers } from "next/headers";
import { ConnectStrava } from "@/components/ConnectStrava";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Activity } from "@/lib/types";
import { getActivities, StravaAPIError } from "@/services/strava";
import { ActivityList } from "./ActivityList";

async function fetchInitialData(): Promise<{
	activities: Activity[];
	stravaError: boolean;
}> {
	try {
		const activities = await getActivities();
		return { activities, stravaError: false };
	} catch (error) {
		if (error instanceof StravaAPIError && error.statusCode === 401) {
			return { activities: [], stravaError: true };
		}
		console.error("Failed to fetch initial activities:", error);
		return { activities: [], stravaError: false };
	}
}

export default async function Home() {
	const session = await auth.api.getSession({ headers: await headers() });

	const stravaAccount = session
		? await prisma.account.findFirst({
				where: {
					userId: session.user.id,
					providerId: "strava",
				},
				select: { id: true, accessToken: true, accessTokenExpiresAt: true },
			})
		: null;

	const stravaConnected =
		!!stravaAccount?.accessToken &&
		(!stravaAccount.accessTokenExpiresAt ||
			stravaAccount.accessTokenExpiresAt > new Date());

	if (!stravaConnected) {
		return (
			<div className="p-4">
				<header className="flex items-center justify-between mb-4">
					<h1 className="text-2xl font-bold">Strava Dashboard</h1>
				</header>
				<div className="flex h-[80vh] items-center justify-center">
					<Card className="w-full max-w-sm">
						<CardHeader>
							<CardTitle className="text-center">
								{stravaAccount ? "Reconnect to Strava" : "Connect to Strava"}
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col items-center justify-center p-6">
							<p className="mb-4 text-center">
								{stravaAccount
									? "Your Strava authentication has expired. Please reconnect to continue."
									: "To see your activities, connect your Strava account."}
							</p>
							<ConnectStrava />
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	const { activities } = await fetchInitialData();

	return (
		<div className="p-4">
			<header className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold">Strava Dashboard</h1>
			</header>
			<ActivityList initialActivities={activities} />
		</div>
	);
}
