"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAcceptLegalDocuments } from "@/hooks/use-compliance";

type LegalDocumentKey = "policy" | "terms";

type LegalDocumentEntry = {
	key: LegalDocumentKey;
	label: string;
	href: string;
};

type LegalConsentWallProps = {
	needsPolicy: boolean;
	needsTerms: boolean;
	/** "initial" = user never accepted this document before; "update" = a newer version was published. */
	variant: "initial" | "update";
};

export function LegalConsentWall({
	needsPolicy,
	needsTerms,
	variant,
}: LegalConsentWallProps) {
	const router = useRouter();
	const { mutateAsync, isPending } = useAcceptLegalDocuments();

	const documents = useMemo<LegalDocumentEntry[]>(() => {
		const entries: LegalDocumentEntry[] = [];
		if (needsPolicy) {
			entries.push({
				key: "policy",
				label: "Privacy Policy",
				href: "/privacy-policy",
			});
		}
		if (needsTerms) {
			entries.push({
				key: "terms",
				label: "Termini e Condizioni",
				href: "/terms-conditions",
			});
		}
		return entries;
	}, [needsPolicy, needsTerms]);

	const [accepted, setAccepted] = useState<Record<LegalDocumentKey, boolean>>({
		policy: false,
		terms: false,
	});

	const allAccepted = documents.every((doc) => accepted[doc.key]);

	const handleAccept = async () => {
		if (!allAccepted) return;
		try {
			await mutateAsync({ policy: needsPolicy, terms: needsTerms });
			router.refresh();
		} catch (error) {
			console.error(error);
		}
	};

	const isUpdate = variant === "update";
	const badgeLabel = isUpdate ? "Aggiornamento Legale" : "Consenso richiesto";
	const title = isUpdate
		? documents.length === 1
			? `Abbiamo aggiornato la nostra ${documents[0].label}`
			: "Abbiamo aggiornato i nostri documenti legali"
		: "Benvenuto in Dromos Studio";
	const description = isUpdate
		? "Per continuare a utilizzare Dromos Studio, ti chiediamo di prendere visione e accettare le nuove condizioni."
		: "Per iniziare a usare Dromos Studio, prendi visione e accetta i seguenti documenti.";

	return (
		<div className="p-4">
			<header className="flex items-center justify-between mb-4">
				<span className="font-black tracking-tighter uppercase mb-2">
					Dromos Studio
				</span>
				<span className="text-[10px] text-neutral-500 tracking-[0.2em] font-bold uppercase">
					{badgeLabel}
				</span>
			</header>
			<div className="flex h-[80vh] items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-center text-xl">{title}</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-6 p-6">
						<p className="text-sm text-center text-muted-foreground">
							{description}
						</p>

						<div className="flex flex-col gap-3">
							{documents.map((doc) => (
								<div
									key={doc.key}
									className="flex items-start space-x-2 bg-muted/50 p-4 rounded-lg"
								>
									<Checkbox
										id={`legal-consent-${doc.key}`}
										checked={accepted[doc.key]}
										onCheckedChange={(c) =>
											setAccepted((prev) => ({
												...prev,
												[doc.key]: c as boolean,
											}))
										}
										className="mt-1"
									/>
									<Label
										htmlFor={`legal-consent-${doc.key}`}
										className="text-sm font-normal leading-relaxed block"
									>
										Dichiaro di aver letto e accettato{" "}
										<Link
											href={doc.href}
											target="_blank"
											className="text-primary underline underline-offset-4 hover:text-primary/80"
										>
											{doc.label}
										</Link>
										.
									</Label>
								</div>
							))}
						</div>

						<Button
							onClick={handleAccept}
							disabled={!allAccepted || isPending}
							className="w-full"
						>
							{isPending ? "Aggiornamento in corso..." : "Accetta e Continua"}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
