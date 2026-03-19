import { ConnectStrava } from "@/components/ConnectStrava";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Activity } from "@/lib/types";
import { getActivities, StravaAPIError } from "@/services/strava";
import { ActivityList } from "./ActivityList";

async function fetchInitialData(): Promise<{ activities: Activity[]; authError: boolean }> {
	try {
		const activities = await getActivities();
		return { activities, authError: false };
	} catch (error) {
		if (error instanceof StravaAPIError && error.statusCode === 401) {
			return { activities: [], authError: true };
		}
		console.error("Failed to fetch initial activities:", error);
		return { activities: [], authError: false };
	}
}

export default async function Home() {
	const { activities, authError } = await fetchInitialData();
	const showConnect = activities.length === 0 || authError;

	return (
		<div className="p-4">
			<header className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold">Strava Dashboard</h1>
			</header>

			{showConnect ? (
				<div className="flex h-[80vh] items-center justify-center">
					<Card className="w-full max-w-sm">
						<CardHeader>
							<CardTitle className={'text-center'}>
								{authError ? "Reconnect to Strava" : "Connect to Strava"}
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col items-center justify-center p-6">
							<p className="mb-4 text-center">
								{authError
									? "Your Strava authentication has expired or is invalid. Please reconnect to continue."
									: "To see your activities, you need to connect your Strava account."}
							</p>
							<ConnectStrava />
						</CardContent>
					</Card>
				</div>
			) : (
				<ActivityList initialActivities={activities} />
			)}
		</div>
	);
}
