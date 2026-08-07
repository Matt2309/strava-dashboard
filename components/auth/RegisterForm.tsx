"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAcceptLegalDocuments } from "@/hooks/use-compliance";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

export function RegisterForm() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [policyAccepted, setPolicyAccepted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const { mutateAsync: acceptLegalDocuments } = useAcceptLegalDocuments();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!policyAccepted) return;

		setLoading(true);
		setError(null);

		const { error: signUpError } = await authClient.signUp.email({
			name,
			email,
			password,
			callbackURL: ROUTES.home.path,
		});

		if (signUpError) {
			setError(
				signUpError.status === 429
					? "Troppi tentativi. Riprova tra qualche minuto."
					: (signUpError.message ?? "Registrazione non riuscita. Riprova."),
			);
			setLoading(false);
		} else {
			// Record the consent the user just gave in the checkbox below. autoSignIn
			// is on by default, so the session already exists at this point.
			try {
				await acceptLegalDocuments({ policy: true, terms: true });
			} catch (consentError) {
				// Don't block navigation: if this fails, the post-login consent wall
				// will catch it and ask the user to accept again.
				console.error(consentError);
			}
			router.push(ROUTES.home.path);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				{error && (
					<p className="text-sm text-destructive text-center">{error}</p>
				)}
				<div className="flex flex-col gap-2">
					<Label htmlFor="name">Nome</Label>
					<Input
						id="name"
						type="text"
						placeholder="Il tuo nome"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						autoComplete="name"
					/>
				</div>
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
				<div className="flex flex-col gap-2">
					<Label htmlFor="password">Password</Label>
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

				<div className="flex items-center space-x-2 pt-2">
					<Checkbox
						id="terms"
						checked={policyAccepted}
						onCheckedChange={(checked) => setPolicyAccepted(checked)}
					/>
					<Label
						htmlFor="terms"
						className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Ho letto e accetto la{" "}
						<Link
							href="/privacy-policy"
							target="_blank"
							className="text-primary underline underline-offset-4 hover:text-primary/80"
						>
							Privacy Policy
						</Link>{" "}
						e i{" "}
						<Link
							href="/terms-conditions"
							target="_blank"
							className="text-primary underline underline-offset-4 hover:text-primary/80"
						>
							Termini e Condizioni
						</Link>
					</Label>
				</div>

				<Button
					type="submit"
					className="w-full mt-2"
					disabled={loading || !policyAccepted}
				>
					{loading ? "Creazione account…" : "Crea account"}
				</Button>
			</form>

			<p className="text-center text-sm text-muted-foreground">
				Hai già un account?{" "}
				<Link
					href={ROUTES.login.path}
					className="underline underline-offset-4 hover:text-primary"
				>
					Accedi
				</Link>
			</p>
		</div>
	);
}
