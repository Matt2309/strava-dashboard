"use client";

import { LegalUpdateWall } from "@/components/legal/legal-update-wall";
import { useAcceptLatestPolicy } from "@/hooks/use-compliance";

export function PolicyUpdateWall() {
	const { mutateAsync, isPending } = useAcceptLatestPolicy();

	return (
		<LegalUpdateWall
			title="Abbiamo aggiornato la nostra Privacy Policy"
			documentLabel="Privacy Policy"
			documentHref="/privacy-policy"
			onAccept={mutateAsync}
			isPending={isPending}
		/>
	);
}
