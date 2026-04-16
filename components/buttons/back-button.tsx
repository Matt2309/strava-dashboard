"use client";

import {ArrowLeftIcon} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
    className?: string;
}

export function BackButton({
                                className,
                            }: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        const referrer = document.referrer;
        const currentOrigin = window.location.origin;

        if (!referrer || !referrer.startsWith(currentOrigin)) {
            router.push("/");
        } else {
            router.back();
        }
    };

    return (
        <div className="flex items-center">
            <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className={cn("text-inherit", className)}
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </Button>
        </div>
    );
}
