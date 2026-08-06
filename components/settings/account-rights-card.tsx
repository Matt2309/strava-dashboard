"use client";

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteAccountDialog } from "@/components/account/delete-account-dialog";
import { ExportDataDialog } from "@/components/account/export-data-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

/**
 * Right of Access/Portability (Art. 15/20) and Right to Erasure (Art. 17),
 * surfaced here too so the privacy settings page is a single place for every
 * GDPR-related action — the underlying dialogs are the same ones already
 * reachable from the user menu (components/sidebar/nav-user.tsx).
 */
export function AccountRightsCard() {
	const [exportOpen, setExportOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>I tuoi diritti</CardTitle>
					<CardDescription>
						Accesso, portabilità e cancellazione dei tuoi dati personali.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-2 sm:flex-row">
					<Button variant="outline" onClick={() => setExportOpen(true)}>
						<Download className="mr-2 size-4" />
						Scarica i miei dati
					</Button>
					<Button variant="destructive" onClick={() => setDeleteOpen(true)}>
						<Trash2 className="mr-2 size-4" />
						Elimina account
					</Button>
				</CardContent>
			</Card>

			<ExportDataDialog open={exportOpen} onOpenChange={setExportOpen} />
			<DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
		</>
	);
}
