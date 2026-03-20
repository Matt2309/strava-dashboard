import { z } from "zod";

export const activitySchema = z.object({
	id: z.number(),
	name: z.string(),
	distance: z.number(),
	moving_time: z.number(),
	elapsed_time: z.number(),
	total_elevation_gain: z.number(),
	type: z.string(),
	sport_type: z.string(),
	start_date: z.string(),
	average_heartrate: z.number().optional(),
	suffer_score: z.number().optional(),
	gear: z
		.object({
			id: z.string(),
			primary: z.boolean(),
			name: z.string(),
			converted_distance: z.number().optional(),
		})
		.optional(),
	device_name: z.string().optional(),
});

export type Activity = z.infer<typeof activitySchema>;
