import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
	title: "Reimposta password — Dromos",
	description: "Scegli una nuova password per il tuo account Dromos",
};

type ResetPasswordPageProps = {
	searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({
	searchParams,
}: ResetPasswordPageProps) {
	const { token, error } = await searchParams;

	// better-auth redirects here without a token (or with `error=INVALID_TOKEN
	// /TOKEN_EXPIRED`) when the link has already been used or has expired.
	if (!token || error) {
		return (
			<div className="flex min-h-screen items-center justify-center p-4">
				<Card className="w-full max-w-sm">
					<CardHeader className="space-y-1 text-center">
						<CardTitle className="text-2xl">Link non valido</CardTitle>
						<CardDescription>
							Questo link per reimpostare la password non è più valido o è
							scaduto.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							className="w-full"
							nativeButton={false}
							render={
								<Link href={ROUTES["forgot-password"].path}>
									Richiedi un nuovo link
								</Link>
							}
						/>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl">Reimposta la password</CardTitle>
					<CardDescription>Scegli una nuova password</CardDescription>
				</CardHeader>
				<CardContent>
					<ResetPasswordForm token={token} />
				</CardContent>
			</Card>
		</div>
	);
}
