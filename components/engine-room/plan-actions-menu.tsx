"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeletePlanDialog } from "@/components/engine-room/delete-plan-dialog";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type PlanActionsMenuProps = {
	planId: string;
	planName: string;
	afterDelete: "redirect" | "refresh";
	className?: string;
};

export function PlanActionsMenu({
	planId,
	planName,
	afterDelete,
	className,
}: PlanActionsMenuProps) {
	const router = useRouter();
	const [deleteOpen, setDeleteOpen] = useState(false);

	return (
		<>
			<DropdownMenu>
				{/* base-ui primitives use a `render` prop instead of asChild. */}
				<DropdownMenuTrigger
					render={
						<Button
							variant="ghost"
							size="icon"
							className={cn(className)}
							aria-label="Plan actions"
						/>
					}
				>
					<MoreHorizontal className="h-4 w-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onClick={() => router.push(ROUTES["plan-edit"].build(planId))}
					>
						<Pencil className="mr-2 size-4" />
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onClick={() => setDeleteOpen(true)}
					>
						<Trash2 className="mr-2 size-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<DeletePlanDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				planId={planId}
				planName={planName}
				afterDelete={afterDelete}
			/>
		</>
	);
}
