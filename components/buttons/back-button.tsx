"use client";

import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackNavigation } from "@/hooks/use-navigation-history";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface BackButtonProps {
	className?: string;
	fallback?: string;
}

export function BackButton({
	className,
	fallback = ROUTES.home.path,
}: BackButtonProps) {
	const goBack = useBackNavigation(fallback);

	return (
		<div className="flex items-center">
			<Button
				variant="ghost"
				size="icon"
				onClick={goBack}
				className={cn("text-inherit", className)}
			>
				<ArrowLeftIcon className="w-6 h-6" />
			</Button>
		</div>
	);
}
