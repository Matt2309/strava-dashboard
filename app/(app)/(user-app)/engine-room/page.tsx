import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {SiteHeader} from "@/components/sidebar/site-header";
import {RedirectButton} from "@/components/redirect-button";
import {getPlans} from "@/routers/engine-room";

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
                        <RedirectButton url={'/engine-room/create'} text={'+ CREATE NEW PROGRAM'} variant={'outline'}></RedirectButton>
                    </div>
                    <div className="flex flex-col gap-4">
                        {plans && plans.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((plan) => (
                                    <Card
                                        key={plan.id}
                                        className="bg-neutral-900 cursor-pointer hover:bg-neutral-800 transition group"
                                    >
                                        <div className="relative w-full h-48 bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-2">
                                                        {plan.type}
                                                    </p>
                                                    <p className="text-lg font-black text-white">PROGRAM</p>
                                                </div>
                                            </div>
                                        </div>

                                        <CardHeader className="bg-neutral-800">
                                            <CardTitle className="text-lg tracking-tight">
                                                {plan.name}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                {plan.expiryDate && (
                                                    <p className="mt-1">
                                                        Expires:{" "}
                                                        {formatDate(
                                                            typeof plan.expiryDate === "string"
                                                                ? plan.expiryDate
                                                                : plan.expiryDate.toISOString(),
                                                        )}
                                                    </p>
                                                )}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="space-y-2">
                                            <RedirectButton url={`/engine-room/${plan.id}`} className="w-full" text={'START WORKOUT'} variant={'secondary'}></RedirectButton>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-neutral-900 rounded-lg">
                                <p className="text-neutral-400 mb-4">No programs created yet</p>
                                <RedirectButton url={'/engine-room/create'} text={'Create Your First Program'} variant={'outline'}></RedirectButton>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
	);
}
