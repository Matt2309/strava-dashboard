"use client";

import type { ReactNode } from "react";
import { SidebarBody } from "@/components/sidebar/sidebar-body";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

type SidebarWrapperProps = {
	children: ReactNode;
};

export function SidebarWrapper({ children }: SidebarWrapperProps) {
	return (
		<>
			<SidebarProvider
				style={
					{
						"--sidebar-width": "calc(var(--spacing) * 72)",
						"--header-height": "calc(var(--spacing) * 12)",
					} as React.CSSProperties
				}
			>
				<SidebarBody variant="inset" />
				<SidebarInset>{children}</SidebarInset>
			</SidebarProvider>
		</>
	);
}
