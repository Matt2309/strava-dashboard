import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ConnectStrava } from "@/components/ConnectStrava";
import { LegalConsentWall } from "@/components/legal/legal-consent-wall";
import { SidebarWrapper } from "@/components/providers/sidebar-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getLegalConsentStatus } from "@/routers/compliance";
import { isStravaConnected } from "@/routers/strava";

type UserAppLayoutProps = Readonly<{
	children: ReactNode;
}>;

const UserAppLayout = async (props: UserAppLayoutProps) => {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/login");
	}

	const [stravaConnected, legalConsent] = await Promise.all([
		isStravaConnected({ userId: session.user.id }),
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

	if (!stravaConnected) {
		return (
			<div className="p-4">
				<header className="flex items-center justify-between mb-4">
					<span className="font-black tracking-tighter uppercase mb-2">
						Dromos Studio
					</span>
					<span className="text-[10px] text-neutral-500 tracking-[0.2em] font-bold uppercase">
						Performance lab
					</span>
				</header>
				<div className="flex h-[80vh] items-center justify-center">
					<Card className="w-full max-w-sm">
						<CardHeader>
							<CardTitle className="text-center">Collega Strava</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col items-center justify-center p-6">
							<p className="mb-4 text-center">
								Per sincronizzare le tue attività e analizzare le performance,
								collega il tuo account Strava.
							</p>
							<ConnectStrava />
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return <SidebarWrapper>{props.children}</SidebarWrapper>;
};

export default UserAppLayout;
