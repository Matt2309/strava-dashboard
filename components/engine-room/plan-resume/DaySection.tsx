import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExerciseCard } from "./ExerciseCard";

export interface WorkoutDayExercise {
	id: string;
	order: number;
	exercise: {
		id: string;
		nameEng: string;
		nameIta: string | null;
		photoUrl: string | null;
	};
	reps: Array<{
		id: string;
		setNumber: number;
		targetReps: string | null;
		targetRpe: number | null;
		weight: number | null;
		machineType: string | null;
	}>;
	restTime: number | null;
	coachNotes: string | null;
}

export interface WorkoutDay {
	id: string;
	name: string;
	notes: string | null;
	exercises: WorkoutDayExercise[];
}

interface DaySectionProps {
	day: WorkoutDay;
}

export function DaySection({ day }: DaySectionProps) {
	const formatRestTime = (seconds: number | null) => {
		if (!seconds) return "N/A";
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}m ${secs}s`;
	};

	return (
		<Card className="w-full bg-transparent border-0">
			<CardHeader>
				<CardTitle className="text-2xl">{day.name}</CardTitle>
				{day.notes && (
					<p className="mt-2 text-sm text-muted-foreground">{day.notes}</p>
				)}
			</CardHeader>
			<CardContent className="space-y-6 flex flex-row gap-5 overflow-scroll">
				{day.exercises.map((exercise, index) => (
					<div key={exercise.id}>
						<ExerciseCard
							exercise={exercise}
							restTime={formatRestTime(exercise.restTime)}
						/>
						{index < day.exercises.length - 1 && <Separator className="mt-6" />}
					</div>
				))}
			</CardContent>
		</Card>
	);
}
