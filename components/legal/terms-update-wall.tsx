"use client";

import { LegalUpdateWall } from "@/components/legal/legal-update-wall";
import { useAcceptLatestTerms } from "@/hooks/use-compliance";

export function TermsUpdateWall() {
	const { mutateAsync, isPending } = useAcceptLatestTerms();

	return (
		<LegalUpdateWall
			title="Abbiamo aggiornato i nostri Termini e Condizioni"
			documentLabel="Termini e Condizioni"
			documentHref="/terms-conditions"
			onAccept={mutateAsync}
			isPending={isPending}
		/>
	);
}
