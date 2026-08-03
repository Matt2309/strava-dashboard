import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LegalConsentWall } from "@/components/legal/legal-consent-wall";
import { SidebarWrapper } from "@/components/providers/sidebar-wrapper";
import { auth } from "@/lib/auth";
import { getLegalConsentStatus } from "@/routers/compliance";

type UserAppLayoutProps = Readonly<{
	children: ReactNode;
}>;

const UserAppLayout = async (props: UserAppLayoutProps) => {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/login");
	}

	const [legalConsent] = await Promise.all([
		getLegalConsentStatus(),
	]);

	const pendingDocuments = [legalConsent.policy, legalConsent.terms].filter(
		(doc) => doc.needed,
	);

	if (pendingDocuments.length > 0) {
		return (
			<LegalConsentWall
				needsPolicy={legalConsent.policy.needed}
				needsTerms={legalConsent.terms.needed}
				variant={
					pendingDocuments.every((doc) => doc.firstTime) ? "initial" : "update"
				}
			/>
		);
	}

	return <SidebarWrapper>{props.children}</SidebarWrapper>;
};

export default UserAppLayout;
