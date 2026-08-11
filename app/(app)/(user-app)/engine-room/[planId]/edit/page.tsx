import { notFound } from "next/navigation";
import { CreateProgramForm } from "@/components/forms/create-plan";
import { planToFormValues } from "@/lib/schemas/engine-room.schema";
import { getPlanDetails } from "@/routers/engine-room";

interface EditPlanPageProps {
	params: Promise<{ planId: string }>;
}

export default async function EditPlanPage({ params }: EditPlanPageProps) {
	const { planId } = await params;

	const plan = await getPlanDetails({ planId }).catch(() => null);
	if (!plan) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="w-full space-y-6 bg-background p-6">
				<div className="flex items-center justify-between border-b border-border pb-6">
					<div>
						<h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
							Edit <span className="text-neutral-600">/ Plan</span>
						</h2>
					</div>
				</div>
				<CreateProgramForm
					mode="edit"
					planId={planId}
					defaultValues={planToFormValues(plan)}
				/>
			</div>
		</div>
	);
}
