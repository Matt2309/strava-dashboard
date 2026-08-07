import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountRightsCard } from "@/components/settings/account-rights-card";
import { HealthDataConsentCard } from "@/components/settings/health-data-consent-card";
import { SiteHeader } from "@/components/sidebar/site-header";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getHealthDataConsentStatusProcedure } from "@/routers/compliance";

export default async function PrivacySettingsPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/login");
	}

	const healthDataConsent = await getHealthDataConsentStatusProcedure();

	return (
		<>
			<SiteHeader title={"Impostazioni privacy"} />
			<div className="flex flex-1 flex-col gap-4 p-5">
				<div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
					<HealthDataConsentCard
						decided={healthDataConsent.decided}
						granted={healthDataConsent.granted}
						timestamp={healthDataConsent.timestamp}
					/>

					<Card>
						<CardHeader>
							<CardTitle>Documenti legali</CardTitle>
							<CardDescription>
								Privacy Policy e Termini e Condizioni che hai accettato.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
							<Link
								href={ROUTES["privacy-policy"].path}
								className="text-primary underline underline-offset-4 hover:text-primary/80"
							>
								Privacy Policy
							</Link>
							<Link
								href={ROUTES["terms-conditions"].path}
								className="text-primary underline underline-offset-4 hover:text-primary/80"
							>
								Termini e Condizioni
							</Link>
						</CardContent>
					</Card>

					<AccountRightsCard />
				</div>
			</div>
		</>
	);
}
