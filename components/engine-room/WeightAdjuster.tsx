"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WeightAdjusterProps {
	weight: number;
	onWeightChange: (weight: number) => void;
	lastSessionWeight?: number;
	increment?: number;
}

export function WeightAdjuster({
	weight,
	onWeightChange,
	lastSessionWeight,
	increment = 2.5,
}: WeightAdjusterProps) {
	const handleDecrement = () => {
		const newWeight = Math.max(0, weight - increment);
		onWeightChange(newWeight);
	};

	const handleIncrement = () => {
		onWeightChange(weight + increment);
	};

	return (
		<div className="space-y-4">
			<div className="text-center">
				<label className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
					Resistance (kg)
				</label>
				{lastSessionWeight !== undefined && (
					<p className="text-xs italic text-neutral-500 mt-1">
						Last Session: {lastSessionWeight}kg
					</p>
				)}
			</div>

			<div className="flex items-center justify-center gap-6">
				<Button
					variant="outline"
					size="lg"
					onClick={handleDecrement}
					className="h-20 w-20 rounded-xl text-2xl font-bold"
				>
					−
				</Button>

				<div className="text-center">
					<Input
						type="number"
						value={weight}
						onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
						className="w-32 text-center text-5xl font-black border-0 bg-transparent p-0 text-white placeholder-neutral-600"
						step={increment}
					/>
				</div>

				<Button
					variant="default"
					size="lg"
					onClick={handleIncrement}
					className="h-20 w-20 rounded-xl text-2xl font-bold bg-white text-black hover:bg-neutral-200"
				>
					+
				</Button>
			</div>
		</div>
	);
}
