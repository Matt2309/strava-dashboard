import { SportShoe } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Activity } from "@/lib/types";
import {
	Progress,
	ProgressLabel,
	ProgressValue,
} from "@/components/ui/progress";

export function EquipmentCard({ activity }: { activity: Activity }) {
	return (
		<Link href={`#` /*`/gear/${gear.id}`*/}>
			<Card className="hover:border-primary transition-colors">
				<CardHeader className="flex flex-row items-center justify-between">
					<div className={"flex items-center justify-center bg-muted p-2"}>
						<SportShoe className="w-5 h-5 mr-2 text-primary" />
					</div>
					<span className="text-sm text-muted-foreground">ACTIVE_DUTY</span>
				</CardHeader>
				<CardContent>
					<CardTitle className="text-2xl font-bold">NOVABLAST 5</CardTitle>
					<span className="text-md text-primary">Performance road trainer</span>
					<Progress value={80} className="w-full max-w-sm mt-10">
						<ProgressLabel className={"text-sm text-muted-foreground"}>
							ODOMETRO
						</ProgressLabel>
						<ProgressValue>
							{(value) => <span className="ms-auto">100/800 km</span>}
						</ProgressValue>
					</Progress>
				</CardContent>
			</Card>
		</Link>
	);
}
