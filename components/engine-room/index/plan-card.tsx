import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib";
import { RedirectButton } from "@/components/buttons/redirect-button";

interface PlanCardProps {
    type: string;
    name: string;
    expiryDate: Date | null;
    id: string;
}

export default function PlanCard({
                                     type,
                                     name,
                                     expiryDate,
                                     id
                                }: PlanCardProps) {
    return (
        <Card>
            <div className="relative w-full h-48 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-xs font-bold tracking-widest uppercase mb-2">
                            {type}
                        </p>
                        <p className="text-lg font-black">
                            {name}
                        </p>
                    </div>
                </div>
            </div>

            <CardHeader>
                <CardDescription className="text-xs">
                    {expiryDate && (
                        <p>
                            Expires:{" "}
                            {formatDate(expiryDate.toISOString())}
                        </p>
                    )}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
                <RedirectButton
                    url={`/engine-room/${id}`}
                    className="w-full"
                    text={"START WORKOUT"}
                    variant={"secondary"}
                ></RedirectButton>
            </CardContent>
        </Card>
    );
}