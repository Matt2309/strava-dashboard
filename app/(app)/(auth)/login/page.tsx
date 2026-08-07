import type { Metadata } from "next";
import { LoginForm } from "@/components/auth";
import { RunningTrackAnimation } from "@/components/auth/RunTrackAnimation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
export const metadata: Metadata = {
	title: "Accedi — Dromos",
	description: "Accedi al tuo account Dromos",
};

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center w-full lg:w-1/2 p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl">Bentornato, atleta.</CardTitle>
					<CardDescription>
						Scegli un metodo per accedere al tuo account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<LoginForm />
				</CardContent>
				<RunningTrackAnimation />
			</Card>
		</div>
	);
}
