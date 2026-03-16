# Data Model

The data model of the application is based on the Strava API. The main data entity is the `Activity`, which is defined by the `activitySchema` in `lib/types.ts`.

## `Activity`

| Field                  | Type     | Description                                                        |
|------------------------|----------|--------------------------------------------------------------------|
| `id`                   | `number` | The unique identifier for the activity.                            |
| `name`                 | `string` | The name of the activity.                                          |
| `distance`             | `number` | The distance of the activity in meters.                            |
| `moving_time`          | `number` | The moving time of the activity in seconds.                        |
| `elapsed_time`         | `number` | The elapsed time of the activity in seconds.                       |
| `total_elevation_gain` | `number` | The total elevation gain of the activity in meters.                |
| `type`                 | `string` | The type of the activity (e.g., "Run", "Ride").                    |
| `sport_type`           | `string` | The sport type of the activity (e.g., "Run", "Ride").              |
| `start_date`           | `string` | The start date of the activity in ISO 8601 format.                 |
| `average_heartrate`    | `number` | The average heart rate of the activity in beats per minute.        |
| `suffer_score`         | `number` | The suffer score of the activity.                                  |
| `gear`                 | `object` | The object that contains info about the gear used in the activity. |
| `device_name`          | `string` | The name of the device used to record the activity.                |
