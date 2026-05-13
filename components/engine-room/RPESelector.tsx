"use client";

import { Button } from "@/components/ui/button";

interface RPESelectorProps {
	value: number;
	onChange: (value: number) => void;
}

const RPE_OPTIONS = [6, 7, 7.5, 8, 8.5, 9, 10];

export function RPESelector({ value, onChange }: RPESelectorProps) {
	return (
		<div className="space-y-3">
			<label className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
				Relative Intensity RPE
			</label>

			<div className="flex justify-between gap-2">
				{RPE_OPTIONS.map((option) => (
					<Button
						key={option}
						onClick={() => onChange(option)}
						variant={value === option ? "default" : "outline"}
						size="sm"
						className="flex-1 rounded-lg font-bold"
					>
						{option}
					</Button>
				))}
			</div>

			<div className="flex justify-between text-xs font-bold tracking-widest text-neutral-500 uppercase mt-4">
				<span>Moderate</span>
				<span>Max Effort</span>
			</div>
		</div>
	);
}
