"use client";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RedirectButtonProps extends React.ComponentProps<typeof Button> {
	text?: string;
	url: string;
	variant?:
		| "default"
		| "outline"
		| "secondary"
		| "ghost"
		| "destructive"
		| "link"
		| null
		| undefined;
}

export function RedirectButton({
	text,
	url,
	variant = "default",
	className,
	...props
}: RedirectButtonProps) {
	const router = useRouter();

	const handleRedirect = () => {
		router.push(url);
	};

	return (
		<Button
			variant={variant}
			size="default"
			onClick={handleRedirect}
			className={cn("p-4", className)}
			{...props}
		>
			{text}
		</Button>
	);
}
