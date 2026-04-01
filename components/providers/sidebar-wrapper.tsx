"use client";

import type { ReactNode } from "react";
import { SidebarBody } from "@/components/sidebar/sidebar-body";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type SidebarWrapperProps = {
	children: ReactNode;
};

export function SidebarWrapper({ children }: SidebarWrapperProps) {
	return (
		<SidebarProvider>
			<SidebarBody />
			<main className="w-full">{children}</main>
		</SidebarProvider>
	);
}
