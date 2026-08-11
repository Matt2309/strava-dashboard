"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useDeletePlan } from "@/hooks/use-engine-room";
import { ROUTES } from "@/lib/routes";

type DeletePlanDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	planId: string;
	planName: string;
	/**
	 * "redirect": deleting from the plan's own detail page — nothing left to
	 * show there, so navigate back to the list.
	 * "refresh": deleting from a card in the list — stay put, just drop the
	 * card from the (re-fetched) list.
	 */
	afterDelete: "redirect" | "refresh";
};

export function DeletePlanDialog({
	open,
	onOpenChange,
	planId,
	planName,
	afterDelete,
}: DeletePlanDialogProps) {
	const router = useRouter();
	const { mutate, isPending } = useDeletePlan();

	const handleDelete = () => {
		mutate(
			{ planId },
			{
				onSuccess: () => {
					toast.success("Plan deleted");
					onOpenChange(false);
					if (afterDelete === "redirect") {
						// replace, not push: Back shouldn't return to a plan that
						// no longer exists.
						router.replace(ROUTES["engine-room"].path);
					}
					router.refresh();
				},
				onError: () => {
					toast.error("Failed to delete plan", {
						description: "Please try again.",
					});
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete plan</DialogTitle>
					<DialogDescription>
						This will permanently delete <strong>{planName}</strong> and all its
						days and exercises. Logged workout sessions for this plan are kept,
						but they will lose their link to it. This action cannot be undone.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isPending}
					>
						{isPending ? "Deleting..." : "Delete plan"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
