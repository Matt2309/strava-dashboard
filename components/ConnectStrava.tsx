"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

export function ConnectStrava() {
	const handleConnect = async () => {
		await authClient.signIn.oauth2({
			providerId: "strava",
			callbackURL: ROUTES.home.path,
		});
	};

	return <Button onClick={handleConnect}>Connect to Strava</Button>;
}
