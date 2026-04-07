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
import {usePathname} from "next/navigation";

export function NavMain({
	items,
}: {
	items: {
		name: string;
		url: string;
		icon?: React.ComponentType<{ className?: string }>;
	}[];
}) {
    const pathname = usePathname()
    return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu className="gap-2">
                    {items.map((item) => (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton tooltip={item.name} className={item.url === pathname ? `bg-card-foreground/5` : ""}>
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
