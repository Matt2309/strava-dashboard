"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type TwoFactorCardProps = {
	enabled: boolean;
	hasPassword: boolean;
};

type Step =
	| "idle"
	| "enable-password"
	| "enable-secret"
	| "enable-verify"
	| "disable"
	| "regen-password"
	| "regen-show";

function downloadBackupCodes(codes: string[]) {
	const blob = new Blob([codes.join("\n")], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "dromos-codici-backup.txt";
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Codes shown exactly once — right after /two-factor/enable or
 * /two-factor/generate-backup-codes — never persisted anywhere the UI can
 * fetch them again. Extracted so the enable flow and the regenerate flow
 * share the exact same copy/download/confirm behaviour.
 */
function BackupCodesPanel({
	codes,
	saved,
	onSavedChange,
}: {
	codes: string[];
	saved: boolean;
	onSavedChange: (saved: boolean) => void;
}) {
	return (
		<div className="flex flex-col gap-3">
			<div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/50 p-3 font-mono text-sm">
				{codes.map((c) => (
					<span key={c}>{c}</span>
				))}
			</div>
			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						navigator.clipboard.writeText(codes.join("\n"));
						toast.success("Copiati negli appunti");
					}}
				>
					Copia
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => downloadBackupCodes(codes)}
				>
					Scarica .txt
				</Button>
			</div>
			<div className="flex items-start space-x-2">
				<Checkbox
					id="codes-saved"
					checked={saved}
					onCheckedChange={(checked) => onSavedChange(checked === true)}
					className="mt-0.5"
				/>
				<Label
					htmlFor="codes-saved"
					className="text-sm font-normal leading-relaxed"
				>
					Ho salvato i codici di backup in un posto sicuro. Ognuno è
					utilizzabile una sola volta e serve a rientrare se perdi il telefono.
				</Label>
			</div>
		</div>
	);
}

/**
 * GDPR audit gap #11 (docs/gdpr-compliance-audit.md § 3): opt-in TOTP + backup
 * codes. Follows the health-data-consent-card.tsx template (Card + Button +
 * Dialog + sonner + router.refresh()).
 *
 * The card's status is always read from `enabled` (i.e. `user.twoFactorEnabled`
 * passed down from the server), never from whether a TwoFactor row exists —
 * a row can exist with the flag still false (dialog closed mid-enable), and
 * that state must render as "not enabled".
 */
export function TwoFactorCard({ enabled, hasPassword }: TwoFactorCardProps) {
	const router = useRouter();
	const [step, setStep] = useState<Step>("idle");
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [totpURI, setTotpURI] = useState("");
	const [backupCodes, setBackupCodes] = useState<string[]>([]);
	const [codesSaved, setCodesSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const reset = () => {
		setStep("idle");
		setPassword("");
		setCode("");
		setTotpURI("");
		setBackupCodes([]);
		setCodesSaved(false);
		setError(null);
	};

	const manualKey = totpURI
		? (() => {
				try {
					return new URL(totpURI).searchParams.get("secret") ?? "";
				} catch {
					return "";
				}
			})()
		: "";

	const handleEnableSubmit = async () => {
		setLoading(true);
		setError(null);

		const { data, error: enableError } = await authClient.twoFactor.enable({
			password,
		});
		setPassword("");

		if (enableError) {
			setError(
				enableError.code === "INVALID_PASSWORD" ||
					enableError.code === "CREDENTIAL_ACCOUNT_NOT_FOUND"
					? "Password non corretta."
					: enableError.status === 429
						? "Troppi tentativi. Riprova tra qualche minuto."
						: (enableError.message ?? "Operazione non riuscita. Riprova."),
			);
			setLoading(false);
			return;
		}

		setTotpURI(data.totpURI);
		setBackupCodes(data.backupCodes);
		setStep("enable-secret");
		setLoading(false);
	};

	const handleVerifySubmit = async () => {
		setLoading(true);
		setError(null);

		const { error: verifyError } = await authClient.twoFactor.verifyTotp({
			code,
		});

		if (verifyError) {
			setError(
				verifyError.code === "INVALID_CODE"
					? "Codice non valido. Controlla che l'orario del telefono sia sincronizzato e riprova."
					: (verifyError.message ?? "Verifica non riuscita. Riprova."),
			);
			setLoading(false);
			return;
		}

		toast.success("Autenticazione a due fattori attivata", {
			description:
				"Al prossimo accesso ti verrà chiesto un codice dalla tua app.",
		});
		reset();
		// The verification just rotated the session (better-auth issues a new
		// one when the flag flips) — the server component read the old
		// twoFactorEnabled, so this MUST refresh, not just close the dialog.
		router.refresh();
	};

	const handleDisableSubmit = async () => {
		setLoading(true);
		setError(null);

		const { error: disableError } = await authClient.twoFactor.disable({
			password,
		});

		if (disableError) {
			setError(
				disableError.code === "INVALID_PASSWORD"
					? "Password non corretta."
					: (disableError.message ?? "Operazione non riuscita. Riprova."),
			);
			setLoading(false);
			return;
		}

		toast.success("Autenticazione a due fattori disattivata");
		reset();
		router.refresh();
	};

	const handleRegenSubmit = async () => {
		setLoading(true);
		setError(null);

		const { data, error: regenError } =
			await authClient.twoFactor.generateBackupCodes({ password });
		setPassword("");

		if (regenError) {
			setError(
				regenError.code === "INVALID_PASSWORD" ||
					regenError.code === "CREDENTIAL_ACCOUNT_NOT_FOUND"
					? "Password non corretta."
					: (regenError.message ?? "Operazione non riuscita. Riprova."),
			);
			setLoading(false);
			return;
		}

		setBackupCodes(data.backupCodes);
		setStep("regen-show");
		setLoading(false);
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Autenticazione a due fattori (2FA)</CardTitle>
					<CardDescription>
						Un codice temporaneo dalla tua app di autenticazione, in aggiunta
						alla password.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{!hasPassword ? (
						<Alert>
							<AlertTitle>Non disponibile per questo account</AlertTitle>
							<AlertDescription>
								Hai creato l&apos;account tramite Google o Strava, quindi non
								hai una password su Dromos. L&apos;autenticazione a due fattori
								richiede la conferma della password e non è al momento
								attivabile per questo tipo di account. La sicurezza del tuo
								accesso dipende dal 2FA configurato sul tuo account Google o
								Strava — ti consigliamo di attivarlo lì.
							</AlertDescription>
						</Alert>
					) : (
						<>
							<div className="text-sm">
								<p>
									Stato:{" "}
									<span className="font-medium">
										{enabled ? "Attiva" : "Non attiva"}
									</span>
								</p>
							</div>

							{enabled && (
								<Alert>
									<AlertTitle>Limite noto</AlertTitle>
									<AlertDescription>
										Il 2FA protegge l&apos;accesso con email e password. Se hai
										anche un account Google o Strava collegato, l&apos;accesso
										tramite quel provider non richiede il secondo fattore.
									</AlertDescription>
								</Alert>
							)}

							<div className="flex gap-2">
								{enabled ? (
									<>
										<Button
											variant="outline"
											onClick={() => setStep("regen-password")}
										>
											Rigenera codici di backup
										</Button>
										<Button
											variant="destructive"
											onClick={() => setStep("disable")}
										>
											Disattiva 2FA
										</Button>
									</>
								) : (
									<Button onClick={() => setStep("enable-password")}>
										Attiva 2FA
									</Button>
								)}
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Enable — step 1: confirm password */}
			<Dialog
				open={step === "enable-password"}
				onOpenChange={(open) => !open && reset()}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Conferma la tua password</DialogTitle>
						<DialogDescription>
							Per attivare il 2FA devi confermare la password del tuo account.
						</DialogDescription>
					</DialogHeader>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="enable-password">Password</Label>
						<Input
							id="enable-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							disabled={loading}
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={reset} disabled={loading}>
							Annulla
						</Button>
						<Button
							onClick={handleEnableSubmit}
							disabled={loading || !password}
						>
							{loading ? "Verifica in corso..." : "Continua"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Enable — step 2: QR + backup codes, shown once. Not dismissible via
			    the close button: leaving mid-flow just leaves an orphan TwoFactor
			    row with twoFactorEnabled still false, which is harmless (the next
			    enable deletes it), but closing with the X would lose the codes. */}
			<Dialog open={step === "enable-secret"}>
				<DialogContent showCloseButton={false} className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Configura l&apos;app authenticator</DialogTitle>
						<DialogDescription>
							Scansiona il codice QR con Google Authenticator, Aegis, 1Password
							o un&apos;app simile.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col items-center gap-3">
						<div className="rounded-md bg-white p-3">
							<QRCode value={totpURI} size={160} />
						</div>
						<details className="w-full text-sm">
							<summary className="cursor-pointer text-muted-foreground">
								Inserisci manualmente
							</summary>
							<p className="mt-2 break-all rounded-md bg-muted/50 p-2 font-mono text-xs tracking-wider">
								{manualKey}
							</p>
						</details>
					</div>
					<BackupCodesPanel
						codes={backupCodes}
						saved={codesSaved}
						onSavedChange={setCodesSaved}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={reset} disabled={loading}>
							Annulla
						</Button>
						<Button
							onClick={() => setStep("enable-verify")}
							disabled={!codesSaved}
						>
							Continua
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Enable — step 3: confirm the app actually works */}
			<Dialog open={step === "enable-verify"}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Verifica il codice</DialogTitle>
						<DialogDescription>
							Inserisci il codice a 6 cifre mostrato dall&apos;app per
							completare l&apos;attivazione.
						</DialogDescription>
					</DialogHeader>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<Input
						value={code}
						onChange={(e) =>
							setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
						}
						inputMode="numeric"
						maxLength={6}
						placeholder="000000"
						className="text-center tracking-[0.5em] font-mono"
						disabled={loading}
						autoFocus
					/>
					<DialogFooter>
						<Button variant="outline" onClick={reset} disabled={loading}>
							Annulla
						</Button>
						<Button
							onClick={handleVerifySubmit}
							disabled={loading || code.length !== 6}
						>
							{loading ? "Verifica in corso..." : "Attiva 2FA"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Disable */}
			<Dialog
				open={step === "disable"}
				onOpenChange={(open) => !open && reset()}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Disattiva l&apos;autenticazione a due fattori
						</DialogTitle>
					</DialogHeader>
					<Alert variant="destructive">
						<AlertDescription>
							Il tuo account tornerà protetto dalla sola password. I codici di
							backup esistenti verranno eliminati.
						</AlertDescription>
					</Alert>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="disable-password">Password</Label>
						<Input
							id="disable-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							disabled={loading}
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={reset} disabled={loading}>
							Annulla
						</Button>
						<Button
							variant="destructive"
							onClick={handleDisableSubmit}
							disabled={loading || !password}
						>
							{loading ? "Disattivazione..." : "Disattiva 2FA"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Regenerate backup codes — step 1: confirm password */}
			<Dialog
				open={step === "regen-password"}
				onOpenChange={(open) => !open && reset()}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rigenera i codici di backup</DialogTitle>
						<DialogDescription>
							I codici precedenti smetteranno immediatamente di funzionare.
						</DialogDescription>
					</DialogHeader>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="regen-password">Password</Label>
						<Input
							id="regen-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							disabled={loading}
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={reset} disabled={loading}>
							Annulla
						</Button>
						<Button onClick={handleRegenSubmit} disabled={loading || !password}>
							{loading ? "Generazione..." : "Rigenera codici"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Regenerate backup codes — step 2: show once */}
			<Dialog open={step === "regen-show"}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>Nuovi codici di backup</DialogTitle>
					</DialogHeader>
					<BackupCodesPanel
						codes={backupCodes}
						saved={codesSaved}
						onSavedChange={setCodesSaved}
					/>
					<DialogFooter>
						<Button
							onClick={() => {
								reset();
								router.refresh();
							}}
							disabled={!codesSaved}
						>
							Fatto
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
