"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

export function LoginForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const { data, error: signInError } = await authClient.signIn.email({
			email,
			password,
			callbackURL: ROUTES.home.path,
		});

		if (signInError) {
			setError(
				signInError.status === 429
					? "Troppi tentativi. Riprova tra qualche minuto."
					: (signInError.message ?? "Accesso non riuscito. Riprova."),
			);
			setLoading(false);
			return;
		}

		// better-auth replaces the sign-in response body with
		// `{ twoFactorRedirect: true }` (still a 200, no error) when the account
		// has 2FA enabled. The cast is needed because that shape lives on the
		// twoFactor plugin's hook type, not on the inferred /sign-in/email
		// return type. lib/auth-client.ts's onTwoFactorRedirect already
		// hard-navigates to /two-factor — keep `loading` true so the button
		// stays disabled through that navigation.
		if ((data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
			return;
		}

		router.push(ROUTES.home.path);
	};

	const handleGoogleLogin = async () => {
		await authClient.signIn.social({
			provider: "google",
			callbackURL: ROUTES.home.path,
		});
	};

	const handleStravaLogin = async () => {
		await authClient.signIn.oauth2({
			providerId: "strava",
			callbackURL: ROUTES.home.path,
		});
	};

	return (
		<div className="flex flex-col gap-6">
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				{error && (
					<p className="text-sm text-destructive text-center">{error}</p>
				)}
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
					<div className="flex items-center justify-between">
						<Label htmlFor="password">Password</Label>
						<Link
							href={ROUTES["forgot-password"].path}
							className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
						>
							Password dimenticata?
						</Link>
					</div>
					<Input
						id="password"
						type="password"
						placeholder="••••••••"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						autoComplete="current-password"
					/>
				</div>
				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? "Accesso in corso…" : "Accedi"}
				</Button>
			</form>

			<div className="relative">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-background px-2 text-muted-foreground">
						Oppure continua con
					</span>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<p className="text-center text-[11px] text-muted-foreground mb-1">
					Nuovo qui? Dopo aver continuato ti chiederemo di leggere e accettare
					la nostra{" "}
					<Link
						href="/privacy-policy"
						target="_blank"
						className="underline underline-offset-2 hover:text-primary"
					>
						Privacy Policy
					</Link>{" "}
					e i{" "}
					<Link
						href="/terms-conditions"
						target="_blank"
						className="underline underline-offset-2 hover:text-primary"
					>
						Termini e Condizioni
					</Link>
					.
				</p>

				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={handleGoogleLogin}
				>
					<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
						<path
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							fill="#4285F4"
						/>
						<path
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							fill="#34A853"
						/>
						<path
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							fill="#FBBC05"
						/>
						<path
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							fill="#EA4335"
						/>
					</svg>
					Continua con Google
				</Button>

				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={handleStravaLogin}
				>
					<svg
						className="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
					</svg>
					Continua con Strava
				</Button>
			</div>

			<p className="text-center text-sm text-muted-foreground">
				{"Non hai un account? "}
				<Link
					href={ROUTES.register.path}
					className="underline underline-offset-4 hover:text-primary"
				>
					Registrati
				</Link>
			</p>
		</div>
	);
}
