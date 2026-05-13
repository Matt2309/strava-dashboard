"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	useStartWorkout,
	useCompleteSet,
	useEndWorkout,
	useGetPlanDetails,
} from "@/hooks/use-engine-room";
import { WeightAdjuster } from "@/components/engine-room/WeightAdjuster";
import { RPESelector } from "@/components/engine-room/RPESelector";
import { MachineSettingsCard } from "@/components/engine-room/MachineSettingsCard";
import { ArrowLeft, Bell, Settings } from "lucide-react";
import Image from "next/image";

interface WorkoutExercise {
	sessionExerciseId: string;
	exerciseId: string;
	exercise: {
		id: string;
		nameEng: string;
		nameIta: string | null;
		photoUrl: string | null;
	};
	alternativeExerciseId: string | null;
	alternativeExercise: {
		id: string;
		nameEng: string;
		nameIta: string | null;
	} | null;
	equipmentSetting1: string | null;
	equipmentSetting2: string | null;
	supersetId: string | null;
	supersetOrder: number | null;
	coachNotes: string | null;
	personalNotes: string | null;
	userExerciseId: string | null;
	targetReps: Array<{
		setNumber: number;
		targetReps: string | null;
		targetRpe: number | null;
		weight: number | null;
		machineType: string | null;
	}>;
}

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

	const { data: planData, isLoading: planLoading } = useGetPlanDetails(dayId, {
		enabled: !sessionId,
	});

	const startWorkoutMutation = useStartWorkout();
	const completeSetMutation = useCompleteSet();
	const endWorkoutMutation = useEndWorkout();

	const handleStartWorkout = () => {
		startWorkoutMutation.mutate(
			{ dayId },
			{
				onSuccess: (data) => {
					setSessionId(data.sessionId);
					setExercises(data.exercises);
					if (data.exercises.length > 0) {
						const firstExercise = data.exercises[0];
						setWeight(firstExercise.targetReps[0]?.weight || 0);
					}
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
					if (currentSet < (exercise.targetReps?.length || 1)) {
						setCurrentSet(currentSet + 1);
						setReps(0);
					} else {
						handleNextExercise();
					}
				},
			},
		);
	};

	const handleNextExercise = () => {
		if (currentExerciseIdx < exercises.length - 1) {
			setCurrentExerciseIdx(currentExerciseIdx + 1);
			setCurrentSet(1);
			setReps(0);
			setWeight(exercises[currentExerciseIdx + 1]?.targetReps[0]?.weight || 0);
		} else {
			if (sessionId) {
				endWorkoutMutation.mutate(
					{
						sessionId,
						sessionNotes: "",
					},
					{
						onSuccess: () => {
							router.push("/engine-room");
						},
					},
				);
			} else {
				router.push("/engine-room");
			}
		}
	};

	if (planLoading && !sessionId) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p>Loading workout...</p>
			</div>
		);
	}

	if (!sessionId) {
		return (
			<div className="flex flex-col items-center justify-center h-screen space-y-6 p-6">
				<div>
					<h1 className="text-5xl font-black text-white">READY?</h1>
					<p className="text-neutral-400 mt-2">Time to push</p>
				</div>
				<Button
					onClick={handleStartWorkout}
					disabled={startWorkoutMutation.isPending}
					size="lg"
					className="bg-white text-black hover:bg-neutral-200"
				>
					{startWorkoutMutation.isPending ? "Starting..." : "START WORKOUT"}
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

	return (
		<div className="min-h-screen bg-neutral-950 text-white pb-20">
			{/* Header */}
			<div className="sticky top-0 z-10 bg-neutral-900 px-6 py-4 flex items-center justify-between">
				<Button onClick={() => router.back()} variant="ghost" size="sm">
					<ArrowLeft className="w-4 h-4" />
				</Button>
				<h1 className="font-black tracking-tighter">DROMOS</h1>
				<div className="flex gap-2">
					<Button variant="ghost" size="sm">
						<Bell className="w-4 h-4" />
					</Button>
					<Button variant="ghost" size="sm">
						<Settings className="w-4 h-4" />
					</Button>
				</div>
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
								{currentSet}/{exercise.targetReps.length}
							</p>
						</div>
					</div>

					{exercise.alternativeExerciseId && (
						<Button variant="outline" size="sm" className="text-xs font-bold">
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
								onChange={(e) => setReps(parseInt(e.target.value) || 0)}
								className="w-20 text-center bg-neutral-900"
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setReps(reps + 1)}
							>
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
					>
						▶▶
					</Button>
					<Button
						onClick={handleCompleteSet}
						disabled={completeSetMutation.isPending}
						size="lg"
						className="flex-1 bg-white text-black hover:bg-neutral-200"
					>
						{completeSetMutation.isPending ? "Saving..." : "NEXT EXERCISE"}
					</Button>
				</div>
			</div>
		</div>
	);
}
