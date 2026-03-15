import { QueryClient } from "@tanstack/react-query";

const MAX_RETRY = 1;

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: MAX_RETRY,
			refetchOnWindowFocus: true,
			refetchOnReconnect: true,
			refetchInterval: false,
			staleTime: 0,
			gcTime: 5 * 60 * 1000, // 5 minuti
		},
		mutations: {
			retry: MAX_RETRY,
		},
	},
});

export default queryClient;
