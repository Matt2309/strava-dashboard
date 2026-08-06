import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { EmailVerificationWall } from "@/components/auth";
import { LegalConsentWall } from "@/components/legal/legal-consent-wall";
import { SidebarWrapper } from "@/components/providers/sidebar-wrapper";
import { auth } from "@/lib/auth";
import { getLegalConsentStatus } from "@/routers/compliance";
import { getEmailVerificationRequirement } from "@/server/services/email-verification.service";

type UserAppLayoutProps = Readonly<{
	children: ReactNode;
}>;

const UserAppLayout = async (props: UserAppLayoutProps) => {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/login");
	}

	const [legalConsent, emailVerification] = await Promise.all([
		getLegalConsentStatus(),
		getEmailVerificationRequirement(session.user.id),
	]);

	const pendingDocuments = [legalConsent.policy, legalConsent.terms].filter(
		(doc) => doc.needed,
	);

	// Legal consent first: it establishes the lawful basis (Art. 6/7) for
	// everything else. Email verification is a security control layered on
	// top of an account that is already lawfully processed, so it comes second.
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

	if (emailVerification.required) {
		return <EmailVerificationWall email={emailVerification.email} />;
	}

	return <SidebarWrapper>{props.children}</SidebarWrapper>;
};

export default UserAppLayout;
