"use client";

import { HeartPulse } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSetHealthDataConsent } from "@/hooks/use-compliance";
import { ROUTES } from "@/lib/routes";

/**
 * Art. 9 GDPR — separate, explicit consent gate for health/biometric data
 * (heart rate, suffer score) shown only in the Garage section, before any
 * activity sync runs (see docs/gdpr-compliance-audit.md § 3 gap #7).
 *
 * Deliberately shown *instead of* the activity list/gear, not as a blocking
 * wall: refusing must not prevent using the Garage (Art. 7(4) — consent must
 * be freely given), it only means heart rate / suffer score are not
 * collected. The decision can be changed anytime from the privacy settings
 * page (Art. 7(3) — as easy to withdraw as to give).
 */
export function HealthDataConsentGate() {
	const router = useRouter();
	const { mutateAsync, isPending } = useSetHealthDataConsent();

	const handleDecision = async (granted: boolean) => {
		try {
			await mutateAsync({ granted });
			router.refresh();
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="flex h-[60vh] items-center justify-center">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<div className="flex items-center gap-2">
						<HeartPulse className="h-5 w-5 text-primary" />
						<CardTitle>Dati sanitari</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					<p className="text-sm text-muted-foreground">
						Per sincronizzare le tue attività possiamo raccogliere anche{" "}
						<span className="font-medium text-foreground">
							frequenza cardiaca media
						</span>{" "}
						e{" "}
						<span className="font-medium text-foreground">
							training load (suffer score)
						</span>
						. Sono dati sanitari (categoria particolare, Art. 9 GDPR) e
						richiedono un consenso separato da quello per Privacy Policy e
						Termini. Se non consenti, il Garage resta comunque completamente
						utilizzabile: attività, attrezzatura e statistiche vengono
						sincronizzate normalmente, senza questi due dati.
					</p>
					<p className="text-xs text-muted-foreground">
						Puoi cambiare questa scelta in qualsiasi momento dalle{" "}
						<Link
							href={ROUTES["privacy-settings"].path}
							className="text-primary underline underline-offset-4 hover:text-primary/80"
						>
							impostazioni privacy
						</Link>
						. Per maggiori dettagli consulta la{" "}
						<Link
							href={ROUTES["privacy-policy"].path}
							target="_blank"
							className="text-primary underline underline-offset-4 hover:text-primary/80"
						>
							Privacy Policy
						</Link>
						.
					</p>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Button
							variant="outline"
							className="flex-1"
							disabled={isPending}
							onClick={() => handleDecision(false)}
						>
							Continua senza dati sanitari
						</Button>
						<Button
							className="flex-1"
							disabled={isPending}
							onClick={() => handleDecision(true)}
						>
							{isPending ? "Salvataggio..." : "Consenti"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
