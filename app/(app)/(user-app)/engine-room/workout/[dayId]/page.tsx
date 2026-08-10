"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { MachineSettingsCard } from "@/components/engine-room/MachineSettingsCard";
import { RPESelector } from "@/components/engine-room/RPESelector";
import { WeightAdjuster } from "@/components/engine-room/WeightAdjuster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	useCompleteSet,
	useEndWorkout,
	useGetWorkoutDay,
	useStartWorkout,
	useSwapExercise,
} from "@/hooks/use-engine-room";
import { parseTargetReps } from "@/lib";
import type { RouterType } from "@/lib/orpc/client";
import { ROUTES } from "@/lib/routes";

type StartWorkoutResult = Awaited<
	ReturnType<RouterType["engineRoom"]["startWorkout"]>
>;
type WorkoutExercise = StartWorkoutResult["exercises"][number];

export default function WorkoutModePage() {
	const router = useRouter();
	const params = useParams();
	const dayId = params.dayId as string;

	const [sessionId, setSessionId] = useState<string | null>(null);
	const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
	const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
	const [weight, setWeight] = useState(0);
	const [reps, setReps] = useState(0);
	const [rpe, setRpe] = useState(7.5);
	const [currentSet, setCurrentSet] = useState(1);

	const { data: dayData, isLoading: dayLoading } = useGetWorkoutDay(dayId, {
		enabled: !sessionId,
	});

	const startWorkoutMutation = useStartWorkout();
	const completeSetMutation = useCompleteSet();
	const endWorkoutMutation = useEndWorkout();
	const swapExerciseMutation = useSwapExercise();

	const handleStartWorkout = () => {
		startWorkoutMutation.mutate(
			{ dayId },
			{
				onSuccess: (data) => {
					setSessionId(data.sessionId);
					setExercises(data.exercises);

					// Resuming an in-progress session: jump to the first
					// exercise that doesn't yet have all its sets logged.
					const resumeIdx = data.resumed
						? data.exercises.findIndex(
								(ex) => ex.completedSets.length < ex.targetReps.length,
							)
						: 0;
					const startIdx = resumeIdx === -1 ? 0 : resumeIdx;
					const startExercise = data.exercises[startIdx];
					const startSet = data.resumed
						? (startExercise?.completedSets.length ?? 0) + 1
						: 1;

					setCurrentExerciseIdx(startIdx);
					setCurrentSet(startSet);
					setWeight(startExercise?.targetReps[0]?.weight || 0);
					setReps(
						parseTargetReps(startExercise?.targetReps[startSet - 1]?.targetReps),
					);
				},
			},
		);
	};

	const handleCompleteSet = () => {
		if (!sessionId) return;
		const exercise = exercises[currentExerciseIdx];
		if (!exercise) return;

		completeSetMutation.mutate(
			{
				sessionId,
				sessionExerciseId: exercise.sessionExerciseId,
				setNumber: currentSet,
				reps,
				weight,
				rpe,
			},
			{
				onSuccess: () => {
					const totalSets = exercise.targetReps?.length || 1;
					if (currentSet < totalSets) {
						const nextSetNumber = currentSet + 1;
						setCurrentSet(nextSetNumber);
						setReps(
							parseTargetReps(exercise.targetReps[nextSetNumber - 1]?.targetReps),
						);
					} else {
						handleNextExercise();
					}
				},
			},
		);
	};

	const handleNextExercise = () => {
		if (currentExerciseIdx < exercises.length - 1) {
			const nextIdx = currentExerciseIdx + 1;
			const nextExercise = exercises[nextIdx];
			setCurrentExerciseIdx(nextIdx);
			setCurrentSet(1);
			setReps(parseTargetReps(nextExercise?.targetReps[0]?.targetReps));
			setWeight(nextExercise?.targetReps[0]?.weight || 0);
		} else {
			if (sessionId) {
				endWorkoutMutation.mutate(
					{
						sessionId,
						sessionNotes: "",
					},
					{
						onSuccess: () => {
							router.push(ROUTES["workout-summary"].build(sessionId));
						},
					},
				);
			} else {
				router.push(ROUTES["engine-room"].path);
			}
		}
	};

	const handleSwapExercise = () => {
		if (!sessionId) return;
		const exercise = exercises[currentExerciseIdx];
		if (!exercise?.alternativeExerciseId || !exercise.alternativeExercise) {
			return;
		}

		swapExerciseMutation.mutate(
			{
				sessionId,
				sessionExerciseId: exercise.sessionExerciseId,
				alternativeExerciseId: exercise.alternativeExerciseId,
			},
			{
				onSuccess: () => {
					setExercises((prev) =>
						prev.map((ex, idx) => {
							if (idx !== currentExerciseIdx) return ex;
							// Swap in the alternative; there is no server-side
							// path to swap back, so drop the alternative
							// pointer to hide the switch button afterwards.
							return {
								...ex,
								exerciseId: exercise.alternativeExerciseId as string,
								exercise: exercise.alternativeExercise as WorkoutExercise["exercise"],
								alternativeExerciseId: null,
								alternativeExercise: null,
							};
						}),
					);
				},
			},
		);
	};

	if (dayLoading && !sessionId) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p>Loading workout...</p>
			</div>
		);
	}

	if (!sessionId) {
		return (
			<div className="flex flex-col items-center justify-center h-screen space-y-6 p-6">
				<div className="text-center">
					<h1 className="text-5xl font-black text-white">READY?</h1>
					<p className="text-neutral-400 mt-2">
						{dayData?.name ?? "Time to push"}
					</p>
				</div>

				{dayData && dayData.exercises.length > 0 && (
					<ul className="w-full max-w-sm space-y-2 text-sm text-neutral-300">
						{dayData.exercises.map((ex) => (
							<li key={ex.id} className="flex justify-between">
								<span>{ex.exercise.nameIta || ex.exercise.nameEng}</span>
								<span className="text-neutral-500">
									{ex.reps.length}x{ex.reps[0]?.targetReps ?? "—"}
								</span>
							</li>
						))}
					</ul>
				)}

				<Button
					onClick={handleStartWorkout}
					disabled={startWorkoutMutation.isPending}
					size="lg"
					className="bg-white text-black hover:bg-neutral-200"
				>
					{startWorkoutMutation.isPending
						? "Starting..."
						: dayData?.activeSessionId
							? "RESUME WORKOUT"
							: "START WORKOUT"}
				</Button>
			</div>
		);
	}

	const exercise = exercises[currentExerciseIdx];
	if (!exercise) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p>No exercises found</p>
			</div>
		);
	}

	const totalSets = exercise.targetReps?.length || 1;
	const isLastSet = currentSet >= totalSets;
	const isLastExercise = currentExerciseIdx === exercises.length - 1;
	const primaryLabel = completeSetMutation.isPending
		? "Saving..."
		: isLastSet
			? isLastExercise
				? "FINISH WORKOUT"
				: "FINISH EXERCISE"
			: "COMPLETE SET";

	return (
		<div className="min-h-screen bg-neutral-950 text-white pb-20">
			{/* Header */}
			<div className="sticky top-0 z-10 bg-neutral-900 px-6 py-4 flex items-center justify-between">
				<Button onClick={() => router.back()} variant="ghost" size="sm">
					<ArrowLeft className="w-4 h-4" />
				</Button>
				<h1 className="font-black tracking-tighter">DROMOS</h1>
				<div className="w-9" />
			</div>

			{/* Main Content */}
			<div className="space-y-8 p-6 max-w-2xl mx-auto">
				{/* Current Exercise */}
				<div className="space-y-4">
					<div className="flex items-start justify-between">
						<div>
							<p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
								Current Exercise
							</p>
							<h2 className="text-4xl font-black tracking-tighter mt-2 italic">
								{exercise.exercise.nameEng}
							</h2>
						</div>
						<div className="text-right">
							<p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
								Set
							</p>
							<p className="text-3xl font-black">
								{currentSet}/{totalSets}
							</p>
						</div>
					</div>

					{exercise.alternativeExerciseId && (
						<Button
							variant="outline"
							size="sm"
							className="text-xs font-bold"
							onClick={handleSwapExercise}
							disabled={swapExerciseMutation.isPending}
						>
							⇄ SWITCH TO ALTERNATIVE
						</Button>
					)}
				</div>

				{/* Exercise Image */}
				{exercise.exercise.photoUrl && (
					<div className="relative w-full h-80 rounded-lg overflow-hidden">
						<Image
							src={exercise.exercise.photoUrl}
							alt={exercise.exercise.nameEng}
							fill
							className="object-cover"
						/>
					</div>
				)}

				{/* Machine Settings */}
				{(exercise.equipmentSetting1 || exercise.equipmentSetting2) && (
					<div>
						<p className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-3">
							Machine Settings
						</p>
						<div className="grid grid-cols-2 gap-4">
							{exercise.equipmentSetting1 && (
								<MachineSettingsCard
									label="Setting 1"
									value={exercise.equipmentSetting1}
								/>
							)}
							{exercise.equipmentSetting2 && (
								<MachineSettingsCard
									label="Setting 2"
									value={exercise.equipmentSetting2}
								/>
							)}
						</div>
					</div>
				)}

				{/* Weight Adjuster */}
				<WeightAdjuster
					weight={weight}
					onWeightChange={setWeight}
					lastSessionWeight={exercise.targetReps[0]?.weight ?? undefined}
				/>

				{/* Target Reps */}
				<div className="space-y-3">
					<p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
						Target Reps
					</p>
					<div className="flex items-center justify-between bg-neutral-900 p-6 rounded-lg">
						<span className="text-3xl font-black">
							{exercise.targetReps[currentSet - 1]?.targetReps || "—"}
						</span>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setReps(Math.max(0, reps - 1))}
							>
								↓
							</Button>
							<Input
								type="number"
								value={reps}
								onChange={(e) => setReps(parseInt(e.target.value, 10) || 0)}
								className="w-20 text-center bg-neutral-900"
							/>
							<Button variant="outline" size="sm" onClick={() => setReps(reps + 1)}>
								↑
							</Button>
						</div>
					</div>
				</div>

				{/* RPE Selector */}
				<RPESelector value={rpe} onChange={setRpe} />

				{/* Action Buttons */}
				<div className="flex gap-3 pt-6">
					<Button
						variant="outline"
						size="lg"
						onClick={handleNextExercise}
						className="flex-1"
						aria-label="Skip exercise"
						title="Skip exercise"
					>
						▶▶
					</Button>
					<Button
						onClick={handleCompleteSet}
						disabled={completeSetMutation.isPending}
						size="lg"
						className="flex-1 bg-white text-black hover:bg-neutral-200"
					>
						{primaryLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
