import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanActionsMenu } from "@/components/engine-room/plan-actions-menu";
import { formatDate } from "@/lib";
import type { PlanDetail } from "./types";

interface PlanHeaderCardProps {
	plan: PlanDetail;
}

export function PlanHeaderCard({ plan }: PlanHeaderCardProps) {
	const exerciseCount = plan.days.reduce(
		(total, day) => total + day.exercises.length,
		0,
	);

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div className="space-y-2">
					<CardTitle className="text-3xl font-black">{plan.name}</CardTitle>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
						<span>
							Type: <strong className="text-foreground">{plan.type}</strong>
						</span>
						<span>
							{plan.days.length} day{plan.days.length === 1 ? "" : "s"} ·{" "}
							{exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}
						</span>
						{plan.expiryDate && (
							<span>
								Expires:{" "}
								<strong className="text-foreground">
									{formatDate(new Date(plan.expiryDate).toISOString())}
								</strong>
							</span>
						)}
					</div>
				</div>
				<PlanActionsMenu
					planId={plan.id}
					planName={plan.name}
					afterDelete="redirect"
				/>
			</CardHeader>
		</Card>
	);
}
