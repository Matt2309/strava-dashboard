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

## `User`

| Field            | Type      | Description                                      |
|------------------|-----------|--------------------------------------------------|
| `id`             | `string`  | The unique identifier for the user.              |
| `name`           | `string`  | The name of the user.                           |
| `email`          | `string`  | The email address of the user (unique).         |
| `email_verified` | `boolean` | Whether the email has been verified.            |
| `image`          | `string`  | The profile image URL of the user (optional).   |
| `created_at`     | `string`  | The creation timestamp (ISO 8601 format).       |
| `updated_at`     | `string`  | The last update timestamp (ISO 8601 format).    |

---

## `Session`

| Field        | Type      | Description                                      |
|--------------|-----------|--------------------------------------------------|
| `id`         | `string`  | The unique identifier for the session.           |
| `expires_at` | `string`  | The expiration date of the session (ISO 8601).   |
| `token`      | `string`  | The session token (unique).                      |
| `created_at` | `string`  | The creation timestamp (ISO 8601 format).        |
| `updated_at` | `string`  | The last update timestamp (ISO 8601 format).     |
| `ip_address` | `string`  | The IP address of the client (optional).         |
| `user_agent` | `string`  | The user agent string (optional).                |
| `user_id`    | `string`  | The ID of the user associated with the session.  |

---

## `Account`

| Field                       | Type      | Description                                                   |
|-----------------------------|-----------|---------------------------------------------------------------|
| `id`                        | `string`  | The unique identifier for the account.                        |
| `account_id`                | `string`  | The account ID from the provider.                             |
| `provider_id`               | `string`  | The authentication provider ID.                               |
| `user_id`                   | `string`  | The ID of the user associated with the account.               |
| `access_token`              | `string`  | The access token (optional).                                  |
| `refresh_token`             | `string`  | The refresh token (optional).                                 |
| `id_token`                  | `string`  | The ID token (optional).                                      |
| `access_token_expires_at`   | `string`  | Access token expiration date (ISO 8601, optional).            |
| `refresh_token_expires_at`  | `string`  | Refresh token expiration date (ISO 8601, optional).           |
| `scope`                     | `string`  | The OAuth scope (optional).                                   |
| `password`                  | `string`  | The password (optional, if applicable).                       |
| `created_at`                | `string`  | The creation timestamp (ISO 8601 format).                     |
| `updated_at`                | `string`  | The last update timestamp (ISO 8601 format).                  |

---

## `Verification`

| Field        | Type      | Description                                      |
|--------------|-----------|--------------------------------------------------|
| `id`         | `string`  | The unique identifier for the verification.      |
| `identifier` | `string`  | The identifier (e.g., email).                    |
| `value`      | `string`  | The verification value/token.                    |
| `expires_at` | `string`  | The expiration date (ISO 8601 format).           |
| `created_at` | `string`  | The creation timestamp (optional).               |
| `updated_at` | `string`  | The last update timestamp (optional).            |

---

## `GearFunctional`

| Field        | Type      | Description                                                         |
|--------------|-----------|---------------------------------------------------------------------|
| `id`         | `string`  | The unique identifier for the functional gear.                      |
| `name`       | `string`  | The name of the gear.                                               |
| `type`       | `string`  | The type of gear (e.g., ROAD_SHOE, TRACK_SHOE).                     |
| `distance`   | `number`  | The total distance covered with this gear.                          |
| `user_id`    | `string`  | The ID of the user owning the gear.                                 |
| `parent_id`  | `string`  | The parent gear ID (for hierarchical relation, optional).           |

---

## `GearDevice`

| Field     | Type     | Description                                               |
|-----------|----------|-----------------------------------------------------------|
| `id`      | `string` | The unique identifier for the device.                     |
| `name`    | `string` | The name of the device.                                   |
| `type`    | `string` | The type of device (e.g., SMARTWATCH, PHONE).             |
| `user_id` | `string` | The ID of the user owning the device.                     |

---

## `Activity`

| Field                  | Type      | Description                                                        |
|------------------------|-----------|--------------------------------------------------------------------|
| `id`                   | `string`  | The unique identifier for the activity.                            |
| `strava_id`            | `string`  | The external Strava ID (unique).                                   |
| `name`                 | `string`  | The name of the activity.                                          |
| `distance`             | `number`  | The distance of the activity in meters.                            |
| `moving_time`          | `number`  | The moving time of the activity in seconds.                        |
| `elapsed_time`         | `number`  | The elapsed time of the activity in seconds.                       |
| `total_elevation_gain` | `number`  | The total elevation gain in meters.                                |
| `type`                 | `string`  | The type of activity (e.g., "Run", "Ride").                        |
| `sport_type`           | `string`  | The sport type (e.g., "TrackRun", "TrailRun").                     |
| `start_date`           | `string`  | The start date in ISO 8601 format.                                 |
| `average_heartrate`    | `number`  | The average heart rate (optional).                                 |
| `suffer_score`         | `number`  | The suffer score (optional).                                       |
| `user_id`              | `string`  | The ID of the user who performed the activity.                     |
| `functional_id`        | `string`  | The ID of the functional gear used (optional).                     |
| `device_id`            | `string`  | The ID of the recording device (optional).                         |
| `spikes_id`            | `string`  | The ID of the spikes used (optional).                              |

---

## `UserStatistics`

| Field                | Type      | Description                                                   |
|----------------------|-----------|---------------------------------------------------------------|
| `id`                 | `string`  | The unique identifier for the statistics record.              |
| `sport_name`         | `string`  | The sport name (e.g., running, cycling).                      |
| `terrain_type`       | `string`  | The terrain type (e.g., road, trail).                         |
| `total_distance_km`  | `number`  | Total distance covered in kilometers.                         |
| `total_time_min`     | `number`  | Total time spent in minutes.                                  |
| `total_elevation_m`  | `number`  | Total elevation gain in meters.                               |
| `sessions_count`     | `number`  | Number of activity sessions.                                  |
| `max_distance_km`    | `number`  | Maximum distance in a single activity.                        |
| `max_elevation_m`    | `number`  | Maximum elevation gain in a single activity.                  |
| `last_activity_date` | `string`  | Date of the last activity (ISO 8601 format).                  |
| `updated_at`         | `string`  | Last update timestamp (ISO 8601 format).                      |
| `user_id`            | `string`  | The ID of the user associated with these statistics.          |
