"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

type ResetPasswordFormProps = {
	token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [invalidToken, setInvalidToken] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			setError("Le due password non coincidono.");
			return;
		}

		setLoading(true);
		setError(null);

		const { error: resetError } = await authClient.resetPassword({
			newPassword: password,
			token,
		});

		if (resetError) {
			if (resetError.code === "INVALID_TOKEN" || resetError.status === 400) {
				setInvalidToken(true);
			} else if (resetError.status === 429) {
				setError("Troppi tentativi. Riprova tra qualche minuto.");
			} else {
				setError(
					resetError.message ??
						"Non è stato possibile aggiornare la password. Riprova.",
				);
			}
			setLoading(false);
			return;
		}

		toast.success("Password aggiornata", {
			description: "Ora puoi accedere con la nuova password.",
		});
		// Server already revoked every session on reset — this just clears the
		// local cookie defensively.
		await authClient.signOut().catch(() => {});
		router.push(ROUTES.login.path);
	};

	if (invalidToken) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-sm text-center text-muted-foreground">
					Il link non è più valido. Potrebbe essere già stato usato o scaduto.
				</p>
				<Button
					className="w-full"
					nativeButton={false}
					render={
						<Link href={ROUTES["forgot-password"].path}>
							Richiedi un nuovo link
						</Link>
					}
				/>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			{error && <p className="text-sm text-destructive text-center">{error}</p>}
			<div className="flex flex-col gap-2">
				<Label htmlFor="password">Nuova password</Label>
				<Input
					id="password"
					type="password"
					placeholder="••••••••"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					autoComplete="new-password"
					minLength={8}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="confirm-password">Conferma password</Label>
				<Input
					id="confirm-password"
					type="password"
					placeholder="••••••••"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					required
					autoComplete="new-password"
					minLength={8}
				/>
			</div>
			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? "Aggiornamento…" : "Reimposta password"}
			</Button>
		</form>
	);
}
