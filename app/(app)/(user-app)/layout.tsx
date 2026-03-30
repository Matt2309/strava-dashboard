import type { ReactNode } from "react";
import { SidebarWrapper } from "@/components/providers/sidebar-wrapper";

type UserAppLayoutProps = Readonly<{
	children: ReactNode;
}>;

const UserAppLayout = async (props: UserAppLayoutProps) => {
	return <SidebarWrapper>{props.children}</SidebarWrapper>;
};

export default UserAppLayout;
