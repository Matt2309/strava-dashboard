import type { Metadata } from "next";
import { TwoFactorForm } from "@/components/auth";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
	title: "Verifica in due passaggi — Dromos",
	description: "Conferma la tua identità per completare l'accesso",
};

export default function TwoFactorPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl">Verifica in due passaggi</CardTitle>
					<CardDescription>
						Inserisci il codice per completare l&apos;accesso
					</CardDescription>
				</CardHeader>
				<CardContent>
					<TwoFactorForm />
				</CardContent>
			</Card>
		</div>
	);
}
