import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type appRouter from "@/routers";

export type RouterType = RouterClient<typeof appRouter>;

declare global {
	var $orpcClient: RouterType | undefined;
}

const link = new RPCLink({
	url: () => {
		if (typeof window === "undefined") {
			throw new Error("RPCLink is not allowed on the server side.");
		}

		return `${window.location.origin}/api/rpc`;
	},
});

/**
 * Fallback to client-side client if server-side client is not available.
 */

const baseClient: RouterType = globalThis.$orpcClient ?? createORPCClient(link);

const orpcClient = createTanstackQueryUtils(baseClient);

export default orpcClient;
