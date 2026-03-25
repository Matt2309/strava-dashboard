import { headers } from "next/headers";
import { ConnectStrava } from "@/components/ConnectStrava";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { isStravaConnected } from "@/routers/strava";
import { ActivityList } from "./ActivityList";

export default async function Home() {
	const session = await auth.api.getSession({ headers: await headers() });
	const stravaConnected = session
		? await isStravaConnected({ userId: session.user.id })
		: false;

	if (!stravaConnected || !session) {
		return (
			<div className="p-4">
				<header className="flex items-center justify-between mb-4">
					<h1 className="text-2xl font-bold">Strava Dashboard</h1>
				</header>
				<div className="flex h-[80vh] items-center justify-center">
					<Card className="w-full max-w-sm">
						<CardHeader>
							<CardTitle className="text-center">
								{!stravaConnected && session
									? "Reconnect to Strava"
									: "Connect to Strava"}
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col items-center justify-center p-6">
							<p className="mb-4 text-center">
								{!stravaConnected && session
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

	return (
		<div className="p-4">
			<header className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold">Strava Dashboard</h1>
			</header>
			<ActivityList />
		</div>
	);
}
