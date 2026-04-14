import { CreateProgramForm } from "@/components/forms/create-plan";

export default function CreatePlanPage() {
	return (
		<div className="min-h-screen bg-background">
            <div className="w-full space-y-6 bg-background p-6">
                <div className="flex items-center justify-between border-b border-border pb-6">
                    <div>
                        <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
                            Create <span className="text-neutral-600">/ Plan</span>
                        </h2>
                    </div>
                </div>
                <CreateProgramForm />
            </div>
		</div>
	);
}
