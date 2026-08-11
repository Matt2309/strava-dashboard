import type { RouterType } from "@/lib/orpc/client";

// Derived from the actual procedure return type instead of hand-written
// structural types — the previous hand-written types in DaySection.tsx only
// listed a handful of fields, which is exactly why targetRpe/weight/
// personalNotes/equipmentSettings/alternativeExercise/superset fields never
// made it to the UI despite the repository already fetching them.
export type PlanDetail = NonNullable<
	Awaited<ReturnType<RouterType["engineRoom"]["getPlanDetails"]>>
>;

export type PlanDetailDay = PlanDetail["days"][number];
export type PlanDetailExercise = PlanDetailDay["exercises"][number];
export type PlanDetailRep = PlanDetailExercise["reps"][number];
