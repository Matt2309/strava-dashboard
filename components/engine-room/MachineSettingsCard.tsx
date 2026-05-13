"use client";

import {Card} from "@/components/ui/card";

interface MachineSettingsCardProps {
	label: string;
	value: string;
}

export function MachineSettingsCard({
	label,
	value,
}: MachineSettingsCardProps) {
	return (
		<Card className="bg-neutral-900 rounded-lg overflow-hidden">
			<div className="flex h-full">
				<div className="w-1 bg-white" />
				<div className="flex-1 p-6">
					<p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
						{label}
					</p>
					<p className="text-xl font-black tracking-tight text-white uppercase mt-2">
						{value}
					</p>
				</div>
			</div>
		</Card>
	);
}
