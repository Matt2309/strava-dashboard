"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

type Mode = "totp" | "backup";

export function TwoFactorForm() {
	const router = useRouter();
	const [mode, setMode] = useState<Mode>("totp");
	const [code, setCode] = useState("");
	const [trustDevice, setTrustDevice] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [expired, setExpired] = useState(false);

	const handleModeChange = (next: Mode) => {
		setMode(next);
		setCode("");
		setError(null);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const { error: verifyError } =
			mode === "totp"
				? await authClient.twoFactor.verifyTotp({ code, trustDevice })
				: await authClient.twoFactor.verifyBackupCode({
						// Backup codes are case- and dash-sensitive (exact string
						// match against the stored list) — only trim, never
						// normalize case or strip the dash.
						code: code.trim(),
						trustDevice,
					});

		if (verifyError) {
			if (verifyError.status === 429) {
				setError("Troppi tentativi. Riprova tra qualche minuto.");
			} else if (verifyError.code === "INVALID_TWO_FACTOR_COOKIE") {
				setExpired(true);
			} else if (verifyError.code === "INVALID_CODE") {
				setError(
					"Codice non valido. Controlla che l'orario del telefono sia sincronizzato e riprova.",
				);
			} else if (verifyError.code === "INVALID_BACKUP_CODE") {
				setError("Codice di backup non valido o già utilizzato.");
			} else if (verifyError.code === "TOTP_NOT_ENABLED") {
				setError(
					"L'autenticazione a due fattori non è configurata per questo account.",
				);
			} else {
				setError(verifyError.message ?? "Verifica non riuscita. Riprova.");
			}
			setLoading(false);
			return;
		}

		router.push(ROUTES.home.path);
		router.refresh();
	};

	if (expired) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-sm text-center text-muted-foreground">
					La finestra per la verifica è scaduta. Accedi di nuovo.
				</p>
				<Button
					className="w-full"
					nativeButton={false}
					render={<Link href={ROUTES.login.path}>Torna all&apos;accesso</Link>}
				/>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{error && <p className="text-sm text-destructive text-center">{error}</p>}

			{mode === "totp" ? (
				<div className="flex flex-col gap-2">
					<Label htmlFor="totp-code">Codice dall&apos;app authenticator</Label>
					<Input
						id="totp-code"
						value={code}
						onChange={(e) =>
							setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
						}
						inputMode="numeric"
						autoComplete="one-time-code"
						pattern="[0-9]*"
						maxLength={6}
						placeholder="000000"
						className="text-center tracking-[0.5em] font-mono"
						required
						autoFocus
					/>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					<Label htmlFor="backup-code">Codice di backup</Label>
					<Input
						id="backup-code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						maxLength={11}
						placeholder="xxxxx-xxxxx"
						className="font-mono"
						autoComplete="off"
						spellCheck={false}
						required
						autoFocus
					/>
				</div>
			)}

			<div className="flex items-center space-x-2">
				<Checkbox
					id="trust-device"
					checked={trustDevice}
					onCheckedChange={(checked) => setTrustDevice(checked === true)}
				/>
				<Label
					htmlFor="trust-device"
					className="text-sm font-normal leading-none"
				>
					Fidati di questo dispositivo per 30 giorni
				</Label>
			</div>
			<p className="text-xs text-muted-foreground">
				Salva un cookie firmato e un token lato server: per 30 giorni non ti
				verrà richiesto un secondo codice su questo dispositivo.
			</p>

			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? "Verifica in corso…" : "Verifica"}
			</Button>

			<button
				type="button"
				onClick={() => handleModeChange(mode === "totp" ? "backup" : "totp")}
				className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground text-center"
			>
				{mode === "totp"
					? "Usa un codice di backup"
					: "Usa l'app authenticator"}
			</button>

			<p className="text-center text-sm text-muted-foreground">
				<Link
					href={ROUTES.login.path}
					className="underline underline-offset-4 hover:text-primary"
				>
					Torna all&apos;accesso
				</Link>
			</p>
		</form>
	);
}
