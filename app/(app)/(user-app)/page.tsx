import { columns } from "@/components/garage/activities/table/columns";
import { DataTable } from "@/components/garage/activities/table/data-table";
import { EquipmentList } from "@/components/garage/gears/EquipmentList";
import { SyncGearButton } from "@/components/garage/gears/SyncGearButton";
import { SiteHeader } from "@/components/sidebar/site-header";
import { getActivities } from "@/routers/strava";

export default async function Home() {
	const activities = await getActivities();
	return (
		<>
			<SiteHeader title={"Garage"} />
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6">
						<div className="flex items-center justify-between">
							<h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
								Equipment <span className="text-neutral-600">/ Inventory</span>
							</h2>
							<SyncGearButton />
						</div>
						<EquipmentList />
						<div className="container mx-auto py-10">
							<h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
								Activities <span className="text-neutral-600">/ List</span>
							</h2>
							<DataTable columns={columns} data={activities} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
