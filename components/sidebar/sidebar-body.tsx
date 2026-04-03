"use client";

import * as React from "react";
import {
	Dumbbell,
	Frame,
	LucideWrench,
	Map,
	PieChart,
	Timer,
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/sidebar/nav-user";
import { NavMain } from "@/components/sidebar/nav-main";

// This is sample data.
const data = {
	projects: [
		{
			name: "Garage",
			url: "#",
			icon: LucideWrench,
		},
		{
			name: "Blueprints",
			url: "#",
			icon: Timer,
		},
		{
			name: "Engine room",
			url: "#",
			icon: Dumbbell,
		},
	],
};

export function SidebarBody({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
							<a href="#">
								<span className="text-base font-semibold">Dromos Studio</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.projects} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
