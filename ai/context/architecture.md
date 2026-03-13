# Architecture

This is a Next.js 16 application with a client-server architecture. The client is a React application that uses TanStack Query to fetch data from the server. The server is an oRPC server that exposes a set of procedures to the client.

## Data Flow

1.  The client makes a request to the oRPC server.
2.  The oRPC server calls the Strava API to fetch the data.
3.  The Strava API returns the data to the oRPC server.
4.  The oRPC server returns the data to the client.
5.  The client uses TanStack Query to cache the data and display it to the user.

## Authentication

The application uses OAuth 2.0 to authenticate with the Strava API. The authentication flow is as follows:

1.  The user clicks the "Connect to Strava" button.
2.  The user is redirected to the Strava authorization page.
3.  The user authorizes the application to access their data.
4.  The user is redirected back to the application with an authorization code.
5.  The application exchanges the authorization code for an access token.
6.  The access token is stored in the cookies.
7.  The access token is used to make requests to the Strava API.

## File Structure

-   `app`: Contains the pages of the application.
-   `components`: Contains the React components.
-   `hooks`: Contains the custom React hooks.
-   `lib`: Contains the utility functions and the oRPC client.
-   `public`: Contains the public assets.
-   `routers`: Contains the oRPC routers.
-   `services`: Contains the services that interact with the Strava API.
-   `ai`: Contains the AI context files.
