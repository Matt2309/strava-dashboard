import { RedirectButton } from "@/components/buttons/redirect-button";
import { ROUTES } from "@/lib/routes";
import { ExerciseItem } from "./exercise-item";
import type { PlanDetailDay } from "./types";

interface DayPanelProps {
	day: PlanDetailDay;
}

export function DayPanel({ day }: DayPanelProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold">{day.name}</h2>
					{day.notes && (
						<p className="mt-1 text-sm text-muted-foreground">{day.notes}</p>
					)}
				</div>
				{day.exercises.length > 0 && (
					<RedirectButton
						url={ROUTES.workout.build(day.id)}
						text="▶ START WORKOUT"
						variant="default"
					/>
				)}
			</div>

			{day.exercises.length > 0 ? (
				<div className="space-y-3">
					{day.exercises.map((exercise, index) => (
						<ExerciseItem key={exercise.id} exercise={exercise} index={index} />
					))}
				</div>
			) : (
				<div className="py-8 text-center text-muted-foreground">
					No exercises configured for this day
				</div>
			)}
		</div>
	);
}
