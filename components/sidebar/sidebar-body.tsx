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
							<a href="#" className="flex flex-col leading-2">
								<span className="font-black tracking-tighter uppercase mb-2">Dromos Studio</span>
                                <span className="text-[10px] text-neutral-500 tracking-[0.2em] font-bold uppercase">Performance lab</span>
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
