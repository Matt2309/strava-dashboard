import { useMutation, useQuery } from "@tanstack/react-query";
import orpcClient from "@/lib/orpc/client";
import type { Activity } from "@/lib/types";

// --- getActivities ---
const activitiesProcedure = orpcClient.strava.getActivities;
export const useGetActivities = (options?: { initialData?: Activity[] }) => {
	return useQuery(
		activitiesProcedure.queryOptions({
			...(options ?? {}),
		}),
	);
};

// --- getActivity ---
const activityProcedure = orpcClient.strava.getActivity;
export const useGetActivity = (id: string) => {
	return useQuery(
		activityProcedure.queryOptions({
			input: { id },
			enabled: !!id,
		}),
	);
};

// --- syncGear ---
const syncGearProcedure = orpcClient.strava.syncUserEquipment;
export const useSyncUserEquipment = () => {
	return useMutation({
		mutationFn: () => syncGearProcedure.call({}),
	});
};

// --- getUserEquipment ---
const getUserEquipmentProcedure = orpcClient.strava.getUserEquipment;
export const useGetUserEquipment = () => {
	return useQuery(getUserEquipmentProcedure.queryOptions());
};

// --- exportToToon ---
export const useExportToToon = () => {
	return useMutation({
		mutationFn: ({ id }: { id: string }) =>
			orpcClient.strava.exportToToon.call({ id }),
	});
};
