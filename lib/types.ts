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
			distance: z.number(),
			converted_distance: z.number().optional(),
		})
		.optional()
		.nullable(),
	device_name: z.string().optional(),
});

export const athleteStatsSchema = z.object({
	all_run_totals: z.object({
		count: z.number(),
		distance: z.number(),
		moving_time: z.number(),
		elevation_gain: z.number(),
	}),
	all_ride_totals: z.object({
		count: z.number(),
		distance: z.number(),
		moving_time: z.number(),
		elevation_gain: z.number(),
	}),
});

export const athleteSchema = z.object({
	id: z.number(),
	username: z.string(),
	resource_state: z.number(),
	firstname: z.string(),
	lastname: z.string(),
	city: z.string().nullable(),
	state: z.string().nullable(),
	country: z.string().nullable(),
	sex: z.string().nullable(),
	premium: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
	badge_type_id: z.number(),
	profile_medium: z.string().nullable(),
	profile: z.string().nullable(),
	friend: z.boolean().nullable(),
	follower: z.boolean().nullable(),
	follower_count: z.number(),
	friend_count: z.number(),
	mutual_friend_count: z.number(),
	athlete_type: z.number(),
	date_preference: z.string().nullable(),
	measurement_preference: z.string(),
	clubs: z.array(z.unknown()),
	ftp: z.number().nullable(),
	weight: z.number().nullable(),
	bikes: z.array(
		z.object({
			id: z.string(),
			primary: z.boolean(),
			name: z.string(),
			resource_state: z.number(),
			distance: z.number(),
		}),
	),
	shoes: z.array(
		z.object({
			id: z.string(),
			primary: z.boolean(),
			name: z.string(),
			resource_state: z.number(),
			distance: z.number(),
		}),
	),
});

export type Activity = z.infer<typeof activitySchema>;
export type Athlete = z.infer<typeof athleteSchema>;
