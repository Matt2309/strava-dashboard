"use client";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import type React from "react";

export function NavMain({
	items,
}: {
	items: {
		name: string;
		url: string;
		icon?: React.ComponentType<{ className?: string }>;
	}[];
}) {
	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu className="gap-2">
                    {items.map((item) => (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton tooltip={item.name}>
                                <Link href={item.url} className="flex flex-row items-center gap-2">
                                    {item.icon && <item.icon />}
                                    <span>{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
