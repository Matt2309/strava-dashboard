import { notFound } from "next/navigation";
import { BackButton } from "@/components/buttons/back-button";
import { DayTabs, PlanHeaderCard } from "@/components/engine-room/plan-detail";
import { SiteHeader } from "@/components/sidebar/site-header";
import { ROUTES } from "@/lib/routes";
import { getPlanDetails } from "@/routers/engine-room";

interface PlanPreviewPageProps {
	params: Promise<{ planId: string }>;
}

export default async function PlanPreviewPage({
	params,
}: PlanPreviewPageProps) {
	const { planId } = await params;

	// getPlanDetails throws on a bad/unowned planId (no dedicated error type),
	// and there is no app/error.tsx to catch it — surface a proper 404 instead
	// of a raw framework error.
	const plan = await getPlanDetails({ planId }).catch(() => null);
	if (!plan) {
		notFound();
	}

	return (
		<>
			<SiteHeader title="Engine room" />
			<div className="space-y-6 p-6">
				<BackButton fallback={ROUTES["engine-room"].path} />

				<PlanHeaderCard plan={plan} />

				{plan.days.length > 0 ? (
					<DayTabs days={plan.days} />
				) : (
					<div className="py-12 text-center">
						<p className="text-muted-foreground">No workout days configured</p>
					</div>
				)}
			</div>
		</>
	);
}
