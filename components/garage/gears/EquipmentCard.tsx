import { Bike, Smartphone, SportShoe, Watch } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Progress,
	ProgressLabel,
	ProgressValue,
} from "@/components/ui/progress";
import type {
	DeviceType,
	FunctionalType,
	GearDevice,
	GearFunctional,
} from "@/lib/generated/prisma/client";

type EquipmentCardProps =
	| { gear: GearFunctional; variant: "functional" }
	| { gear: GearDevice; variant: "device" };

const GEAR_TYPE_LABELS: Record<FunctionalType, string> = {
	ROAD_SHOE: "Road Shoe",
	TRACK_SHOE: "Track Shoe",
	SPIKES_PINS: "Spikes",
	BIKE: "Bike",
	OTHER: "Other",
};

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
	SMARTWATCH: "Smartwatch",
	PHONE: "Phone",
	HR_MONITOR: "Heart Rate Monitor",
};

const MAX_DISTANCE_KM = 800;

function getGearIcon(type: FunctionalType | DeviceType, variant: string) {
	if (variant === "device") {
		switch (type as DeviceType) {
			case "SMARTWATCH":
				return <Watch className="w-5 h-5 text-primary" />;
			case "PHONE":
				return <Smartphone className="w-5 h-5 text-primary" />;
			case "HR_MONITOR":
				return <Watch className="w-5 h-5 text-primary" />;
			default:
				return <Smartphone className="w-5 h-5 text-primary" />;
		}
	}

	switch (type as FunctionalType) {
		case "BIKE":
			return <Bike className="w-5 h-5 text-primary" />;
		default:
			return <SportShoe className="w-5 h-5 text-primary" />;
	}
}

export function EquipmentCard({ gear, variant }: EquipmentCardProps) {
	const isFunctional = variant === "functional";
	const distanceKm = isFunctional
		? Math.round((gear as GearFunctional).distance / 1000)
		: 0;
	const progressValue = isFunctional
		? Math.min((distanceKm / MAX_DISTANCE_KM) * 100, 100)
		: 0;

	const typeLabel = isFunctional
		? GEAR_TYPE_LABELS[(gear as GearFunctional).type]
		: DEVICE_TYPE_LABELS[(gear as GearDevice).type];

	return (
		<Card className="hover:border-primary transition-colors">
			<CardHeader className="flex flex-row items-center justify-between">
				<div className="flex items-center justify-center bg-muted p-2">
					{getGearIcon(
						isFunctional
							? (gear as GearFunctional).type
							: (gear as GearDevice).type,
						variant,
					)}
				</div>
				<span className="text-sm text-muted-foreground uppercase">
					{typeLabel}
				</span>
			</CardHeader>
			<CardContent>
				<CardTitle className="text-2xl font-bold">{gear.name}</CardTitle>
				{isFunctional && (
					<Progress value={progressValue} className="w-full max-w-sm mt-10">
						<ProgressLabel className="text-sm text-muted-foreground">
							ODOMETER
						</ProgressLabel>
						<ProgressValue>
							{() => (
								<span className="ms-auto">
									{distanceKm}/{MAX_DISTANCE_KM} km
								</span>
							)}
						</ProgressValue>
					</Progress>
				)}
			</CardContent>
		</Card>
	);
}
