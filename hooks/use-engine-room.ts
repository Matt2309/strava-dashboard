import { useMutation, useQuery } from "@tanstack/react-query";
import orpcClient from "@/lib/orpc/client";

// --- getPlans ---
const getPlansProcedure = orpcClient.engineRoom.getPlans;
export const useGetPlans = () => {
	return useQuery(getPlansProcedure.queryOptions());
};

// --- getPlanDetails ---
const getPlanDetailsProcedure = orpcClient.engineRoom.getPlanDetails;
export const useGetPlanDetails = (
	planId: string,
	options?: { enabled?: boolean },
) => {
	return useQuery(
		getPlanDetailsProcedure.queryOptions({
			input: { planId },
			enabled: !!planId && options?.enabled !== false,
		}),
	);
};

// --- createPlan ---
const createPlanProcedure = orpcClient.engineRoom.createPlan;
export const useCreatePlan = () => {
	return useMutation({
		mutationFn: (input: Parameters<typeof createPlanProcedure.call>[0]) =>
			createPlanProcedure.call(input),
	});
};

// --- startWorkout ---
const startWorkoutProcedure = orpcClient.engineRoom.startWorkout;
export const useStartWorkout = () => {
	return useMutation({
		mutationFn: (input: Parameters<typeof startWorkoutProcedure.call>[0]) =>
			startWorkoutProcedure.call(input),
	});
};

// --- completeSet ---
const completeSetProcedure = orpcClient.engineRoom.completeSet;
export const useCompleteSet = () => {
	return useMutation({
		mutationFn: (input: Parameters<typeof completeSetProcedure.call>[0]) =>
			completeSetProcedure.call(input),
	});
};

// --- swapExercise ---
const swapExerciseProcedure = orpcClient.engineRoom.swapExercise;
export const useSwapExercise = () => {
	return useMutation({
		mutationFn: (input: Parameters<typeof swapExerciseProcedure.call>[0]) =>
			swapExerciseProcedure.call(input),
	});
};

// --- endWorkout ---
const endWorkoutProcedure = orpcClient.engineRoom.endWorkout;
export const useEndWorkout = () => {
	return useMutation({
		mutationFn: (input: Parameters<typeof endWorkoutProcedure.call>[0]) =>
			endWorkoutProcedure.call(input),
	});
};

// --- getExercises ---
const getExercisesProcedure = orpcClient.engineRoom.getExercises;
export const useGetExercises = (
	muscleGroupId?: string,
	options?: { enabled?: boolean },
) => {
	return useQuery(
		getExercisesProcedure.queryOptions({
			input: { muscleGroupId: muscleGroupId || "" },
			enabled: !!muscleGroupId && options?.enabled !== false,
		}),
	);
};

// --- getMuscleGroups ---
const getMuscleGroupsProcedure = orpcClient.engineRoom.getMuscleGroups;
export const useGetMuscleGroups = () => {
	return useQuery(getMuscleGroupsProcedure.queryOptions());
};
