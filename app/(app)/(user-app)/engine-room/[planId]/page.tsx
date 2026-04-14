"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useGetPlanDetails } from "@/hooks/use-engine-room";

export default function PlanPreviewPage() {
	const router = useRouter();
	const params = useParams();
	const planId = params.planId as string;

	const { data: plan, isLoading, isError } = useGetPlanDetails(planId);

	if (isLoading)
		return (
			<div className="p-6">
				<p>Loading...</p>
			</div>
		);
	if (isError || !plan)
		return (
			<div className="p-6">
				<p>Error</p>
			</div>
		);

	return (
		<div className="space-y-8 p-6">
			<Button onClick={() => router.back()} variant="ghost" size="sm">
				Back
			</Button>
			<h1 className="text-4xl font-black text-white">{plan.name}</h1>
		</div>
	);
}
