"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import queryClient from "@/lib/query";

type TanstackProviderProps = Readonly<{
	children: ReactNode;
}>;

export const TanstackProvider = (props: TanstackProviderProps) => {
	return (
		<QueryClientProvider client={queryClient}>
			<ReactQueryDevtools initialIsOpen={false} />
			{props.children}
		</QueryClientProvider>
	);
};
