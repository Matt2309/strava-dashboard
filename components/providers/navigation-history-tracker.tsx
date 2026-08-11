"use client";

import { useTrackNavigationHistory } from "@/hooks/use-navigation-history";

/**
 * Renders nothing — just runs `useTrackNavigationHistory()` so every page
 * in the app (including the (legal) pages, which sit outside the
 * (user-app) layout) gets its history entries stamped. See
 * `hooks/use-navigation-history.ts` for why this can't be done via
 * `document.referrer`.
 */
export function NavigationHistoryTracker() {
	useTrackNavigationHistory();
	return null;
}
