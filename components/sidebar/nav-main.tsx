"use client";

import { Construction } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
}: {
	items: {
		name: string;
		url: string;
		icon?: React.ComponentType<{ className?: string }>;
		wip?: boolean;
	}[];
}) {
	const pathname = usePathname();
	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu className="gap-2">
					{items.map((item) => (
						<SidebarMenuItem key={item.name}>
							<SidebarMenuButton
								tooltip={item.name}
								className={item.url === pathname ? `bg-card-foreground/5` : ""}
							>
								<Link
									href={item.url}
									className="flex flex-row items-center gap-2"
								>
									{item.icon && <item.icon />}
									<span>{item.name}</span>
									{item.wip && (
										<div className="text-yellow-500 flex flex-row items-center gap-1 text-xs">
											<span>Work in progress</span>
											<Construction className="size-4" />
										</div>
									)}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
