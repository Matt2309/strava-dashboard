"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAcceptLatestPolicy } from "@/hooks/use-compliance";

export function PolicyUpdateWall() {
    const [accepted, setAccepted] = useState(false);
    const router = useRouter();
    const { mutateAsync: acceptPolicyMutation, isPending } = useAcceptLatestPolicy();

    const handleAccept = async () => {
        if (!accepted) return;

        try {
            await acceptPolicyMutation();
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-4">
            <header className="flex items-center justify-between mb-4">
                <span className="font-black tracking-tighter uppercase mb-2">
                    Dromos Studio
                </span>
                <span className="text-[10px] text-neutral-500 tracking-[0.2em] font-bold uppercase">
                    Aggiornamento Legale
                </span>
            </header>
            <div className="flex h-[80vh] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center text-xl">
                            Abbiamo aggiornato la nostra Privacy Policy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 p-6">
                        <p className="text-sm text-center text-muted-foreground">
                            Per continuare a utilizzare Dromos Studio, ti chiediamo di prendere visione e accettare le nuove condizioni.
                        </p>

                        <div className="flex items-start space-x-2 bg-muted/50 p-4 rounded-lg">
                            <Checkbox
                                id="terms-update"
                                checked={accepted}
                                onCheckedChange={(c) => setAccepted(c)}
                                className="mt-1"
                            />
                            <Label htmlFor="terms-update" className="text-sm font-normal leading-relaxed block">
                                Dichiaro di aver letto e accettato la nuova <Link href="/privacy-policy" target="_blank" className="text-primary underline underline-offset-4 hover:text-primary/80">Privacy Policy</Link>.
                            </Label>
                        </div>

                        <Button
                            onClick={handleAccept}
                            disabled={!accepted || isPending}
                            className="w-full"
                        >
                            {isPending ? "Aggiornamento in corso..." : "Accetta e Continua"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}