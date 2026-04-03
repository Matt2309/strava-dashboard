"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSyncUserEquipment } from "@/hooks";

export function SyncGearButton() {
	const { mutate, isPending } = useSyncUserEquipment();

	const handleSync = () => {
		mutate(undefined, {
			onSuccess: (result) => {
				toast.success(
					`Synced ${result.shoes} shoes and ${result.bikes} bikes!`,
				);
			},
			onError: () => {
				toast.error("Failed to sync equipment");
			},
		});
	};

	return (
		<Button onClick={handleSync} disabled={isPending} variant="outline">
			{isPending ? "Syncing..." : "Sync Gear from Strava"}
		</Button>
	);
}
