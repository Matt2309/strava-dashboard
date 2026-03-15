"use client";

import { Button } from "@/components/ui/button";
import { useGetAuthUrl } from "@/hooks";

export function ConnectStrava() {
	const { isLoading: isLoadingUrl, data: authUrl } = useGetAuthUrl();

	const handleConnect = () => {
		if (!isLoadingUrl && authUrl) {
			window.location.href = authUrl.toString();
		}
	};

	return <Button onClick={handleConnect}>Connect to Strava</Button>;
}
