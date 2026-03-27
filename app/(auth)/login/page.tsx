import type { Metadata } from "next";
import { LoginForm } from "@/components/auth";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {RunningTrackAnimation} from "@/components/auth/RunTrackAnimation";
export const metadata: Metadata = {
	title: "Sign In — Dromos",
	description: "Sign in to your Dromos account",
};

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center w-full lg:w-1/2 p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-2xl">Welcome, athlete.</CardTitle>
					<CardDescription>
						Choose a method to access your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<LoginForm />
				</CardContent>
                <RunningTrackAnimation/>
			</Card>
		</div>
	);
}
