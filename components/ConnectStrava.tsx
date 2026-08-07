"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

export function ConnectStrava() {
	const handleConnect = async () => {
        await authClient.oauth2.link({
            providerId: "strava",
            callbackURL: ROUTES.garage.path,
        });
	};

	return <Button onClick={handleConnect}>Connect to Strava</Button>;
}
