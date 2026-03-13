# Strava API Notes

This document contains some notes about the Strava API.

## Authentication

The Strava API uses OAuth 2.0 for authentication. The authentication flow is as follows:

1.  The user is redirected to the Strava authorization page.
2.  The user authorizes the application to access their data.
3.  The user is redirected back to the application with an authorization code.
4.  The application exchanges the authorization code for an access token.
5.  The access token is used to make requests to the Strava API.

## Endpoints

The application uses the following endpoints:

-   `https://www.strava.com/oauth/authorize`: The authorization endpoint.
-   `https://www.strava.com/oauth/token`: The token endpoint.
-   `https://www.strava.com/api/v3/athlete/activities`: The endpoint for fetching the user's activities.
-   `https://www.strava.com/api/v3/activities/{id}`: The endpoint for fetching a specific activity.

## Rate Limiting

The Strava API has a rate limit of 600 requests every 15 minutes, and a daily limit of 30,000 requests.

## TOON Format

The application can export an activity's data to a TOON JSON file. The TOON format is a custom JSON-based format for representing activity data.
