"use client";

import {
	Dumbbell,
	KeyRound,
	LucideWrench,
	ShieldCheck,
	Timer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ROUTES } from "@/lib/routes";

const data = {
	projects: [
		{
			name: "Garage",
			url: ROUTES.garage.path,
			icon: LucideWrench,
			wip: false,
		},
		{
			name: "Blueprints",
			url: "#",
			icon: Timer,
			wip: true,
		},
		{
			name: "Engine room",
			url: "#",
			icon: Dumbbell,
			wip: true,
		},
	],
};

export function SidebarBody({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const router = useRouter();
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							className="data-[slot=sidebar-menu-button]:p-1.5! flex flex-col items-start leading-2 p-5"
							onClick={() => {
								router.push(ROUTES.home.path);
							}}
						>
							<div className="flex flex-col leading-2">
								<span className="font-black tracking-tighter uppercase mb-2">
									Dromos Studio
								</span>
								<span className="text-[10px] text-neutral-500 tracking-[0.2em] font-bold uppercase">
									Performance lab
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.projects} />
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => router.push(ROUTES["account-settings"].path)}
							className="text-neutral-500"
							tooltip="Sicurezza"
						>
							<KeyRound />
							<span>Sicurezza</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => router.push(ROUTES["privacy-settings"].path)}
							className="text-neutral-500"
							tooltip="Impostazioni privacy"
						>
							<ShieldCheck />
							<span>Impostazioni privacy</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>

				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
