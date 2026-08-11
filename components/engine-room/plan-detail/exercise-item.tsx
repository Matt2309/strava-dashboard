import Image from "next/image";
import type { ReactNode } from "react";
import { formatRestTime } from "@/lib";
import { ExerciseSetTable } from "./exercise-set-table";
import type { PlanDetailExercise } from "./types";

interface ChipProps {
	children: ReactNode;
}

function Chip({ children }: ChipProps) {
	return (
		<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
			{children}
		</span>
	);
}

interface ExerciseItemProps {
	exercise: PlanDetailExercise;
	index: number;
}

export function ExerciseItem({ exercise, index }: ExerciseItemProps) {
	const displayName = exercise.exercise.nameIta || exercise.exercise.nameEng;
	const alternativeName = exercise.alternativeExercise
		? exercise.alternativeExercise.nameIta ||
			exercise.alternativeExercise.nameEng
		: null;

	return (
		<div className="flex gap-4 rounded-lg border border-border bg-card p-4">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
				{index + 1}
			</div>

			{exercise.exercise.photoUrl && (
				<div className="relative size-14 shrink-0 overflow-hidden rounded-md">
					<Image
						src={exercise.exercise.photoUrl}
						alt={displayName}
						fill
						className="object-cover"
					/>
				</div>
			)}

			<div className="flex-1 space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="font-bold uppercase tracking-tight">{displayName}</h3>
					{exercise.supersetId && (
						<Chip>
							Superset{" "}
							{exercise.supersetOrder != null
								? `#${exercise.supersetOrder}`
								: ""}
						</Chip>
					)}
					{alternativeName && <Chip>⇄ Alt: {alternativeName}</Chip>}
				</div>

				<ExerciseSetTable
					reps={exercise.reps}
					restTime={formatRestTime(exercise.restTime)}
				/>

				{(exercise.equipmentSetting1 || exercise.equipmentSetting2) && (
					<div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
						{exercise.equipmentSetting1 && (
							<p>🔧 {exercise.equipmentSetting1}</p>
						)}
						{exercise.equipmentSetting2 && (
							<p>🔧 {exercise.equipmentSetting2}</p>
						)}
					</div>
				)}

				{exercise.coachNotes && (
					<p className="text-xs text-muted-foreground">
						📋 {exercise.coachNotes}
					</p>
				)}
				{exercise.personalNotes && (
					<p className="text-xs text-muted-foreground">
						👤 {exercise.personalNotes}
					</p>
				)}
			</div>
		</div>
	);
}
