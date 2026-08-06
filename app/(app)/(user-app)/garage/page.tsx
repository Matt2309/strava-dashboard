import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ConnectStrava } from "@/components/ConnectStrava";
import { columns } from "@/components/garage/activities/table/columns";
import { DataTable } from "@/components/garage/activities/table/data-table";
import { EquipmentList } from "@/components/garage/gears/EquipmentList";
import { SyncGearButton } from "@/components/garage/gears/SyncGearButton";
import { HealthDataConsentGate } from "@/components/garage/health-data-consent-gate";
import { SiteHeader } from "@/components/sidebar/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getHealthDataConsentStatusProcedure } from "@/routers/compliance";
import { getActivities, isStravaConnected } from "@/routers/strava";

export default async function Home() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/login");
	}

	const [stravaConnected] = await Promise.all([
		isStravaConnected({ userId: session.user.id }),
	]);

	if (!stravaConnected) {
		return (
			<>
				<SiteHeader title={"Garage"} />
				<div className="flex flex-1 flex-col p-5">
					<div className="flex h-[80vh] items-center justify-center">
						<Card className="w-full max-w-sm">
							<CardHeader>
								<CardTitle className="text-center">Collega Strava</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col items-center justify-center p-6">
								<p className="mb-4 text-center">
									Per sincronizzare le tue attività e analizzare le performance,
									collega il tuo account Strava.
								</p>
								<ConnectStrava />
							</CardContent>
						</Card>
					</div>
				</div>
			</>
		);
	}

	// Art. 9 GDPR — resolve the health data consent decision before the
	// Garage triggers any sync (getActivities() -> getActivitiesForUser() ->
	// runInitialSync() on a user's first visit). Showing the gate here keeps
	// the consent scoped to the Garage section only, as decided in
	// docs/gdpr-compliance-audit.md § 3 gap #7.
	const healthDataConsent = await getHealthDataConsentStatusProcedure();
	if (!healthDataConsent.decided) {
		return (
			<>
				<SiteHeader title={"Garage"} />
				<div className="flex flex-1 flex-col p-5">
					<HealthDataConsentGate />
				</div>
			</>
		);
	}

	const activities = await getActivities();
	return (
		<>
			<SiteHeader title={"Garage"} />
			<div className="flex flex-1 flex-col p-5">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
								Equipment <span className="text-neutral-600">/ Inventory</span>
							</h2>
							<SyncGearButton />
						</div>
						<EquipmentList />
						<div className="flex items-center justify-between mt-5">
							<h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
								Activities <span className="text-neutral-600">/ List</span>
							</h2>
						</div>
						<DataTable columns={columns} data={activities} />
					</div>
				</div>
			</div>
		</>
	);
}
