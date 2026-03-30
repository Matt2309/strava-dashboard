"use client";

import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarBody } from "@/components/sidebar/sidebar-body";

type SidebarWrapperProps = {
	children: ReactNode;
};

export function SidebarWrapper({ children }: SidebarWrapperProps) {
	return (
		<SidebarProvider
        >
			<SidebarBody />
			<main className="w-full">
				<SidebarTrigger></SidebarTrigger>
				{children}
			</main>
		</SidebarProvider>
	);
}
