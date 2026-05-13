import { BackButton } from "@/components/buttons/back-button";
import { DaySection } from "@/components/engine-room/plan-resume";
import { getPlanDetails } from "@/routers/engine-room";

interface PlanPreviewPageProps {
	params: Promise<{ planId: string }>;
}

export default async function PlanPreviewPage({
	params,
}: PlanPreviewPageProps) {
	const resolvedParams = await params;
	const planId = resolvedParams.planId;

	const plan = await getPlanDetails({ planId });

	return (
		<div className="space-y-8 p-6">
			<BackButton />

			{/* Header */}
			<div className="space-y-2">
				<h1 className="text-4xl font-black">{plan?.name}</h1>
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<span>
						Type: <strong>{plan?.type}</strong>
					</span>
					{plan?.expiryDate && (
						<span>
							Expires:{" "}
							<strong>{new Date(plan.expiryDate).toLocaleDateString()}</strong>
						</span>
					)}
				</div>
			</div>

			{/* Days List */}
			<div className="space-y-6">
				{plan?.days && plan.days.length > 0 ? (
					plan.days.map((day) => <DaySection key={day.id} day={day} />)
				) : (
					<div className="py-12 text-center">
						<p className="text-muted-foreground">No workout days configured</p>
					</div>
				)}
			</div>
		</div>
	);
}
