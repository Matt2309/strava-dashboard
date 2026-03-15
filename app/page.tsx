import { ConnectStrava } from "@/components/ConnectStrava";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Activity } from "@/lib/types";
import { getActivities } from "@/services/strava";
import { ActivityList } from "./ActivityList";

export default async function Home() {
	let initialActivities: Activity[] = [];
	try {
		initialActivities = await getActivities();
	} catch (error) {
		console.error("Failed to fetch initial activities:", error);
	}

	return (
		<div className="p-4">
			<header className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold">Strava Dashboard</h1>
			</header>

			{initialActivities.length === 0 ? (
				<div className="flex h-[80vh] items-center justify-center">
					<Card className="w-full max-w-sm">
						<CardHeader>
							<CardTitle>Connect to Strava</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col items-center justify-center p-6">
							<p className="mb-4 text-center">
								To see your activities, you need to connect your Strava account.
							</p>
							<ConnectStrava />
						</CardContent>
					</Card>
				</div>
			) : (
				<ActivityList initialActivities={initialActivities} />
			)}
		</div>
	);
}
