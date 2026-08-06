"use client";

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
import { useExportUserData } from "@/hooks";

type ExportDataDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function downloadJson(data: unknown) {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `dromos-export-${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export function ExportDataDialog({
	open,
	onOpenChange,
}: ExportDataDialogProps) {
	const { mutate, isPending } = useExportUserData();

	const handleExport = () => {
		mutate(undefined, {
			onSuccess: (data) => {
				downloadJson(data);
				toast.success("Export completato", {
					description: "I tuoi dati sono stati scaricati in formato JSON.",
				});
				onOpenChange(false);
			},
			onError: () => {
				toast.error("Export non riuscito", {
					description: "Non è stato possibile generare il file. Riprova.",
				});
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Scarica i tuoi dati</DialogTitle>
					<DialogDescription>
						Verrà generato un file JSON con i dati personali che conserviamo su
						di te: profilo e consensi legali, account collegati (senza token di
						accesso), attività Strava (inclusi i dati grezzi non ancora
						eliminati), attrezzatura e statistiche aggregate.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Annulla
					</Button>
					<Button onClick={handleExport} disabled={isPending}>
						{isPending ? "Preparazione..." : "Scarica JSON"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
