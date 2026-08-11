"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { ROUTES } from "@/lib/routes";

// Key we stamp onto each history entry's state object to record its
// position in the app's own navigation stack (0 = first entry created by
// this document load/tab). We can't rely on `document.referrer` for this —
// it only reflects the document load, never client-side App Router
// navigations (router.push, <Link>) — so it can't tell a real "there is a
// previous entry" from "this tab/document just loaded".
const ENTRY_INDEX_KEY = "__dromosEntryIndex";
// sessionStorage key holding the highest index minted so far in this tab.
const COUNTER_KEY = "__dromosNavCounter";

// In-memory mirror of the current entry's index. Next.js clears
// `preserveCustomHistoryState` (and therefore our stamp) on refresh(),
// server actions, and server-patch navigations — all of which can leave the
// pathname unchanged, so the tracking effect below won't re-run and
// `history.state` may momentarily lose the stamp. The mirror keeps
// `useBackNavigation` correct in that window.
let currentEntryIndex = 0;

function readStampedIndex(state: unknown): number | null {
	const value = (state as Record<string, unknown> | null)?.[ENTRY_INDEX_KEY];
	return typeof value === "number" ? value : null;
}

/**
 * Mounted once near the app root. Stamps every history entry created while
 * the app is open with a monotonically increasing index, so we can later
 * tell a real "back" destination (a previous entry we created) apart from
 * "there is nothing behind this page" (direct load, bookmark, new tab,
 * post-login redirect, ...).
 */
export function useTrackNavigationHistory() {
	const pathname = usePathname();

	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname isn't read in the body — it's a trigger to re-run this effect on every navigation.
	useEffect(() => {
		const state = window.history.state as Record<string, unknown> | null;
		const stamped = readStampedIndex(state);

		if (stamped !== null) {
			// Entry we've already stamped (browser back/forward landed on it,
			// or the page was reloaded — history.state survives a reload).
			// Adopt its index instead of minting a new one.
			currentEntryIndex = stamped;
			return;
		}

		const lastMinted = Number(sessionStorage.getItem(COUNTER_KEY) ?? "-1");
		const index = lastMinted < 0 ? 0 : lastMinted + 1;

		currentEntryIndex = index;
		sessionStorage.setItem(COUNTER_KEY, String(index));

		// No `url` argument: passing one would make Next's patched
		// replaceState treat this as an external navigation and dispatch
		// ACTION_RESTORE. Spreading `state` (which carries Next's own `__NA` /
		// `__PRIVATE_NEXTJS_INTERNALS_TREE`) makes Next's patch early-return
		// to the native replaceState, so this never touches the router.
		window.history.replaceState({ ...state, [ENTRY_INDEX_KEY]: index }, "");
		// Only the pathname is tracked (see module docs for why search params
		// are intentionally excluded) — a query-only change falls back to the
		// in-memory mirror, which is safe: worst case `canGoBack` reads false
		// and we push the fallback instead of a real back.
	}, [pathname]);
}

/**
 * Returns a stable `goBack` callback: real `router.back()` when a previous
 * entry created by this app exists, otherwise `router.push(fallback)`.
 */
export function useBackNavigation(fallback: string = ROUTES.home.path) {
	const router = useRouter();

	return useCallback(() => {
		const stamped = readStampedIndex(window.history.state);
		const index = stamped ?? currentEntryIndex;

		if (index > 0) {
			router.back();
		} else {
			router.push(fallback);
		}
	}, [router, fallback]);
}
