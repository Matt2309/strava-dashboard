import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TwoFactorCard } from "@/components/settings/two-factor-card";
import { SiteHeader } from "@/components/sidebar/site-header";
import { auth } from "@/lib/auth";
import { getTwoFactorStatusProcedure } from "@/routers/security";

export default async function AccountSettingsPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/login");
	}

	const twoFactor = await getTwoFactorStatusProcedure();

	return (
		<>
			<SiteHeader title={"Sicurezza"} />
			<div className="flex flex-1 flex-col gap-4 p-5">
				<div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
					<TwoFactorCard
						enabled={twoFactor.enabled}
						hasPassword={twoFactor.hasPassword}
					/>
				</div>
			</div>
		</>
	);
}
