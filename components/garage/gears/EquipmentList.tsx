"use client";

import { EquipmentCard } from "@/components/garage/gears/EquipmentCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUserEquipment } from "@/hooks/use-strava";

export function EquipmentList() {
	const { data, isLoading, isError } = useGetUserEquipment();

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list, order never changes
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-3/4" />
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-[80vh] items-center justify-center">
				<p className="text-red-500">Error loading equipment.</p>
			</div>
		);
	}

	const functional = data?.functional ?? [];
	const devices = data?.devices ?? [];

	if (functional.length === 0 && devices.length === 0) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-muted-foreground">
					No equipment found. Sync your gear from Strava.
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{functional.map((gear) => (
				<EquipmentCard key={gear.id} gear={gear} variant="functional" />
			))}
			{devices.map((device) => (
				<EquipmentCard key={device.id} gear={device} variant="device" />
			))}
		</div>
	);
}
