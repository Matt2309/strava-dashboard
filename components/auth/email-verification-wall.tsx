"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteAccountDialog } from "@/components/account/delete-account-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

type EmailVerificationWallProps = {
	email: string;
};

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Soft wall: blocks the app (mirrors components/legal/legal-consent-wall.tsx)
 * until the user's email is verified, but MUST NOT be able to lock anyone
 * out — a typo'd address at registration is otherwise a permanent dead end,
 * since there is no profile UI to correct it (Art. 16 gap, still open in
 * docs/gdpr-compliance-audit.md). Every escape hatch below exists for that
 * reason: showing the address in the clear, letting the user sign out, and
 * — critically — letting them delete the account from here. Without the
 * delete option this would be an Art. 17 regression.
 */
export function EmailVerificationWall({ email }: EmailVerificationWallProps) {
	const router = useRouter();
	const [sending, setSending] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const startCooldown = () => {
		setCooldown(RESEND_COOLDOWN_SECONDS);
		const interval = setInterval(() => {
			setCooldown((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const handleResend = async () => {
		setSending(true);
		const { error } = await authClient.sendVerificationEmail({
			email,
			callbackURL: ROUTES.home.path,
		});

		if (error) {
			// EMAIL_ALREADY_VERIFIED means the link was already clicked (maybe in
			// another tab) — just re-check instead of showing an error.
			if (error.status === 400 && error.code === "EMAIL_ALREADY_VERIFIED") {
				router.refresh();
			} else if (error.status === 429) {
				toast.error("Troppi tentativi", {
					description: "Riprova tra qualche minuto.",
				});
			} else {
				toast.error("Invio non riuscito", {
					description: "Non è stato possibile inviare l'email. Riprova.",
				});
			}
		} else {
			toast.success("Email inviata", {
				description: `Controlla la casella ${email}.`,
			});
			startCooldown();
		}

		setSending(false);
	};

	const handleSignOut = async () => {
		await authClient.signOut().catch(() => {});
		router.push(ROUTES.login.path);
	};

	return (
		<>
			<div className="p-4">
				<header className="flex items-center justify-between mb-4">
					<span className="font-black tracking-tighter uppercase mb-2">
						Dromos Studio
					</span>
					<span className="text-[10px] text-neutral-500 tracking-[0.2em] font-bold uppercase">
						Verifica richiesta
					</span>
				</header>
				<div className="flex h-[80vh] items-center justify-center">
					<Card className="w-full max-w-md">
						<CardHeader>
							<CardTitle className="text-center text-xl">
								Conferma la tua email
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-6 p-6">
							<p className="text-sm text-center text-muted-foreground">
								Abbiamo inviato un link di conferma a{" "}
								<span className="font-medium text-foreground">{email}</span>.
								Clicca il link per continuare a usare Dromos Studio.
							</p>

							<div className="flex flex-col gap-2">
								<Button
									onClick={handleResend}
									disabled={sending || cooldown > 0}
									className="w-full"
								>
									{cooldown > 0
										? `Invia di nuovo (${cooldown}s)`
										: sending
											? "Invio in corso..."
											: "Invia di nuovo l'email"}
								</Button>
								<Button
									variant="outline"
									onClick={() => router.refresh()}
									className="w-full"
								>
									Ho verificato — aggiorna
								</Button>
							</div>

							<div className="flex items-center justify-between text-sm">
								<button
									type="button"
									onClick={handleSignOut}
									className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
								>
									Esci
								</button>
								<button
									type="button"
									onClick={() => setDeleteOpen(true)}
									className="text-destructive underline underline-offset-4 hover:text-destructive/80"
								>
									Elimina account
								</button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
		</>
	);
}
