"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useSetHealthDataConsent } from "@/hooks/use-compliance";

type HealthDataConsentCardProps = {
	decided: boolean;
	granted: boolean;
	timestamp: Date | null;
};

/**
 * Art. 9 GDPR — lets the user grant, refuse or revoke consent for health
 * data (heart rate, suffer score) collected in the Garage section, outside
 * of the initial gate (see components/garage/health-data-consent-gate.tsx
 * and docs/gdpr-compliance-audit.md § 3 gap #7). Revoking is confirmed
 * explicitly because it also erases health data already collected — as easy
 * to withdraw as it was to give (Art. 7(3)), but not something to trigger by
 * accident.
 */
export function HealthDataConsentCard({
	decided,
	granted,
	timestamp,
}: HealthDataConsentCardProps) {
	const router = useRouter();
	const { mutate, isPending } = useSetHealthDataConsent();
	const [revokeOpen, setRevokeOpen] = useState(false);

	const applyDecision = (next: boolean) => {
		mutate(
			{ granted: next },
			{
				onSuccess: () => {
					toast.success(next ? "Consenso concesso" : "Consenso revocato", {
						description: next
							? "Le prossime attività sincronizzate includeranno frequenza cardiaca e training load."
							: "Frequenza cardiaca e training load già raccolti sono stati eliminati.",
					});
					setRevokeOpen(false);
					router.refresh();
				},
				onError: () => {
					toast.error("Operazione non riuscita", {
						description:
							"Non è stato possibile aggiornare il consenso. Riprova.",
					});
				},
			},
		);
	};

	const statusLabel = !decided
		? "Non ancora deciso"
		: granted
			? "Concesso"
			: "Non concesso";

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Dati sanitari (Art. 9 GDPR)</CardTitle>
					<CardDescription>
						Frequenza cardiaca media e training load (suffer score) delle
						attività Strava.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="text-sm">
						<p>
							Stato: <span className="font-medium">{statusLabel}</span>
						</p>
						{timestamp && (
							<p className="text-muted-foreground">
								Ultimo aggiornamento:{" "}
								{timestamp.toLocaleDateString("it-IT", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						)}
					</div>
					<div>
						{granted ? (
							<Button
								variant="outline"
								onClick={() => setRevokeOpen(true)}
								disabled={isPending}
							>
								Revoca consenso
							</Button>
						) : (
							<Button onClick={() => applyDecision(true)} disabled={isPending}>
								{isPending ? "Salvataggio..." : "Concedi consenso"}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			<Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Revoca consenso dati sanitari</DialogTitle>
						<DialogDescription>
							Frequenza cardiaca media e training load già raccolti verranno
							eliminati permanentemente dalle tue attività. Le prossime
							sincronizzazioni non li includeranno finché non concedi di nuovo
							il consenso.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRevokeOpen(false)}
							disabled={isPending}
						>
							Annulla
						</Button>
						<Button
							variant="destructive"
							onClick={() => applyDecision(false)}
							disabled={isPending}
						>
							{isPending ? "Revoca in corso..." : "Revoca e elimina i dati"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
