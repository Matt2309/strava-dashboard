import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
	title: "Registrati — Dromos",
	description: "Crea il tuo account Dromos",
};

export default function RegisterPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl">Crea un account</CardTitle>
					<CardDescription>Inserisci i tuoi dati per iniziare</CardDescription>
				</CardHeader>
				<CardContent>
					<RegisterForm />
				</CardContent>
			</Card>
		</div>
	);
}
