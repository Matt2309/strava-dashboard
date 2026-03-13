import { useQuery, useMutation } from "@tanstack/react-query";
import orpcClient from "@/lib/orpc/client";

// --- getAuthUrl ---
const authUrlProcedure = orpcClient.strava.getAuthUrl;

export const useGetAuthUrl = () => {
    return useQuery(authUrlProcedure.queryOptions());
};


// --- getActivities ---
const activitiesProcedure = orpcClient.strava.getActivities;
export const useGetActivities = (options) => {
    return useQuery(
        activitiesProcedure.queryOptions({
            ...options,
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


// --- exportToToon ---
export const useExportToToon = () => {
    return useMutation({
        mutationFn: ({ id }: { id: string }) =>
            orpcClient.strava.exportToToon.call({ id }),
    });
};