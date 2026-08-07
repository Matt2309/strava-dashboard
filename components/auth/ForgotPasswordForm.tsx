"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

export function ForgotPasswordForm() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const { error: requestError } = await authClient.requestPasswordReset({
			email,
			redirectTo: ROUTES["reset-password"].path,
		});

		// Deliberately the SAME success state whether or not the address is
		// registered — better-auth already returns a constant body either way
		// to prevent email enumeration; branching the UI on the result would
		// undo that protection. Only the 429 case gets distinct copy.
		if (requestError && requestError.status === 429) {
			setError("Troppi tentativi. Riprova tra qualche minuto.");
			setLoading(false);
			return;
		}

		setSent(true);
		setLoading(false);
	};

	if (sent) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-sm text-center text-muted-foreground">
					Se {email} è un indirizzo registrato, riceverai a breve un&apos;email
					con il link per reimpostare la password.
				</p>
				<Button
					variant="outline"
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
			<div className="flex flex-col gap-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					type="email"
					placeholder="tu@esempio.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					autoComplete="email"
				/>
			</div>
			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? "Invio in corso…" : "Invia link di reimpostazione"}
			</Button>
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
