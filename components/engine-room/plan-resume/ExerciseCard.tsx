import Image from "next/image";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { WorkoutDayExercise } from "./DaySection";
import { SetsRepsGrid } from "./set-reps-grid";

interface ExerciseCardProps {
    exercise: WorkoutDayExercise;
    restTime: string;
}

export function ExerciseCard({ exercise, restTime }: ExerciseCardProps) {
    const displayName = exercise.exercise.nameIta || exercise.exercise.nameEng;

    return (
        <Card className="w-[320px] overflow-hidden p-0">
            {/* Image FULL BLEED */}
            {exercise.exercise.photoUrl && (
                <div className="relative w-full pt-[56.25%] overflow-hidden">
                    <Image
                        src={exercise.exercise.photoUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                    />
                </div>
            )}

            <CardContent className="p-5 flex flex-col gap-6">
                {/* Title */}
                <CardTitle className="text-xl font-bold uppercase tracking-tight">
                    {displayName}
                </CardTitle>

                {/* Stats */}
                <SetsRepsGrid reps={exercise.reps} restTime={restTime} />
            </CardContent>
        </Card>
    );
}