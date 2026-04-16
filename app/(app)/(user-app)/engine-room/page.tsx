import { RedirectButton } from "@/components/buttons/redirect-button";
import { SiteHeader } from "@/components/sidebar/site-header";
import { getPlans } from "@/routers/engine-room";
import PlanCard from "@/components/engine-room/index/plan-card";

export default async function EngineRoomHomePage() {
	const plans = await getPlans();

	return (
		<>
			<SiteHeader title={"Engine room"} />
			<div className="flex flex-1 flex-col p-5">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex items-center justify-between">
						<h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
							ENGINE <span className="text-neutral-600">/ ROOM</span>
						</h2>
						<RedirectButton
							url={"/engine-room/create"}
							text={"+ CREATE NEW PROGRAM"}
							variant={"outline"}
						></RedirectButton>
					</div>
					<div className="flex flex-col gap-4">
						{plans && plans.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{plans.map((plan) => (
									<PlanCard type={plan.type}
                                              name={plan.name}
                                              expiryDate={plan.expiryDate}
                                              id={plan.id}
                                              key={plan.id}
                                    />
								))}
							</div>
						) : (
							<div className="text-center py-12 bg-neutral-900 rounded-lg">
								<p className="text-neutral-400 mb-4">No programs created yet</p>
								<RedirectButton
									url={"/engine-room/create"}
									text={"Create Your First Program"}
									variant={"outline"}
								></RedirectButton>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
