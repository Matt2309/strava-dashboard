import { getPlanDetails } from "@/routers/engine-room";
import {BackButton} from "@/components/buttons/back-button";

interface PlanPreviewPageProps {
    params: Promise<{ planId: string }>;
}

export default async function PlanPreviewPage({ params }: PlanPreviewPageProps) {
    const resolvedParams = await params;
    const planId = resolvedParams.planId;

    const plan = await getPlanDetails({planId});

    return (
        <div className="space-y-8 p-6">
            <BackButton/>
            <h1 className="text-4xl font-black">{plan?.name}</h1>
        </div>
    );
}