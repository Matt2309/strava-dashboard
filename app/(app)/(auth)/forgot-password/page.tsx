import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
	title: "Password dimenticata — Dromos",
	description: "Reimposta la password del tuo account Dromos",
};

export default function ForgotPasswordPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl">Password dimenticata?</CardTitle>
					<CardDescription>
						Inserisci la tua email: se è registrata, ti invieremo un link per
						reimpostare la password.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ForgotPasswordForm />
				</CardContent>
			</Card>
		</div>
	);
}
