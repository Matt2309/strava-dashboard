"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteAccount } from "@/hooks";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

const CONFIRM_WORD = "ELIMINA";

type DeleteAccountDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteAccountDialog({
	open,
	onOpenChange,
}: DeleteAccountDialogProps) {
	const router = useRouter();
	const { mutate, isPending } = useDeleteAccount();
	const [confirmText, setConfirmText] = useState("");

	const handleOpenChange = (next: boolean) => {
		if (!next) setConfirmText("");
		onOpenChange(next);
	};

	const handleDelete = () => {
		if (confirmText !== CONFIRM_WORD) return;

		mutate(undefined, {
			onSuccess: async () => {
				toast.success("Account eliminato", {
					description: "Tutti i tuoi dati sono stati rimossi da Dromos.",
				});
				await authClient.signOut().catch(() => {});
				router.push(ROUTES.login.path);
				router.refresh();
			},
			onError: () => {
				toast.error("Eliminazione non riuscita", {
					description: "Non è stato possibile eliminare l'account. Riprova.",
				});
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Elimina account</DialogTitle>
					<DialogDescription>
						Questa azione è irreversibile. Verranno eliminati permanentemente:
						il tuo profilo, le attività sincronizzate, l&apos;attrezzatura e le
						statistiche. L&apos;autorizzazione Strava collegata verrà inoltre
						revocata.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="delete-account-confirm" className="text-sm">
						Scrivi <span className="font-medium">{CONFIRM_WORD}</span> per
						confermare
					</Label>
					<Input
						id="delete-account-confirm"
						value={confirmText}
						onChange={(e) => setConfirmText(e.target.value)}
						disabled={isPending}
						autoComplete="off"
					/>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isPending}
					>
						Annulla
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={confirmText !== CONFIRM_WORD || isPending}
					>
						{isPending ? "Eliminazione..." : "Elimina account"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
