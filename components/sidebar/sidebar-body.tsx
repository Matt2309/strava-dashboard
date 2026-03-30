"use client";

import type * as React from "react";
import {
	Timer,
	HelpCircle,
	Layers2,
	Settings,
	LucideWrench,
	Dumbbell,
	Scale,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	navMain: [
		{
			title: "Garage",
			url: "#",
			icon: LucideWrench,
		},
		{
			title: "Blueprints",
			url: "#",
			icon: Timer,
		},
		{
			title: "Engine room",
			url: "#",
			icon: Dumbbell,
		},
	],
	navSecondary: [
		{
			title: "Settings",
			url: "#",
			icon: Settings,
		},
		{
			title: "Get Help",
			url: "#",
			icon: HelpCircle,
		},
		{
			title: "Privacy Policy",
			url: "#",
			icon: Scale,
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
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:p-1.5!"
						>
							<a href="#">
								<Layers2 className="size-5!" />
								<span className="text-base font-semibold">Dromos Studio</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
