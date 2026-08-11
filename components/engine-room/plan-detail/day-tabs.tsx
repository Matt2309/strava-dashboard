"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DayPanel } from "./day-panel";
import type { PlanDetailDay } from "./types";

interface DayTabsProps {
	days: PlanDetailDay[];
}

export function DayTabs({ days }: DayTabsProps) {
	const [activeDay, setActiveDay] = useState(0);
	const currentDay = days[activeDay] ?? days[0];

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap gap-2 border-b border-border pb-4">
				{days.map((day, index) => (
					<button
						key={day.id}
						type="button"
						onClick={() => setActiveDay(index)}
						className={cn(
							"rounded-md px-4 py-2 font-semibold transition-colors",
							activeDay === index
								? "bg-foreground text-background"
								: "border border-border bg-card text-foreground hover:bg-muted",
						)}
					>
						{day.name}
					</button>
				))}
			</div>

			{currentDay && <DayPanel day={currentDay} />}
		</div>
	);
}
