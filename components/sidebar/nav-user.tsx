"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

export function NavUser() {
	const router = useRouter();

	const { isMobile } = useSidebar();
	const { data: session } = authClient.useSession();

	const user = session?.user;
	const initials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
		: "U";

	const manageLogout = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push(ROUTES.login.path);
				},
			},
		});
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							/>
						}
					>
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarImage
								src={user?.image ?? undefined}
								alt={user?.name ?? "User"}
							/>
							<AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">
								{user?.name ?? "User"}
							</span>
							<span className="truncate text-xs">{user?.email ?? ""}</span>
						</div>
						<ChevronsUpDown className="ml-auto size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarImage
											src={user?.image ?? undefined}
											alt={user?.name ?? "User"}
										/>
										<AvatarFallback className="rounded-lg">
											{initials}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">
											{user?.name ?? "User"}
										</span>
										<span className="truncate text-xs">
											{user?.email ?? ""}
										</span>
									</div>
								</div>
							</DropdownMenuLabel>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={manageLogout}>
								<LogOut className="mr-2 size-4" />
								Log out
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
