"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSyncUserEquipment } from "@/hooks";

export function SyncGearButton() {
    const { refetch, isFetching } = useSyncUserEquipment();

    const handleSync = async () => {
        const { data: result, error } = await refetch();

        if (error) {
            toast.error("Failed to sync");
            return;
        }

        if (result) {
            toast.success(
                `Synced ${result.shoes} shoes and ${result.bikes} bikes!`
            );
        }
    };

    return (
        <Button
            onClick={handleSync}
            disabled={isFetching}
            variant="outline"
        >
            {isFetching ? "Syncing..." : "Sync Gear from Strava"}
        </Button>
    );
}