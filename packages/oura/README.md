# Oura

Sleep, readiness, activity, stress, resilience, heart rate, SpO2, VO2 max, cardiovascular age, workouts, sessions, tags, rest mode, ring configuration and battery data from the Oura Ring API (v2). Includes the `sandbox` endpoints, which return synthetic data for testing.

**Interface:** OpenAPI, from Oura's official document at https://cloud.ouraring.com/v2/static/json/openapi-1.41.json (API docs: https://cloud.ouraring.com/v2/docs). The URL carries the spec version, so a newer release needs it bumped in `openapi.ts`.

**Auth:** OAuth 2.0 authorization code. Oura's authentication page marks personal access tokens as deprecated, so this package offers OAuth only. Create an app in the Oura developer portal at https://cloud.ouraring.com/oauth/applications and add the Executor redirect URI shown on the connect page. Requested scopes: `email personal daily heartrate workout tag session spo2` (space-separated), the eight scopes on Oura's authentication page. `heart_health` appears in the spec's OAuth scheme but not on that page and no operation uses it, so it is not requested. Oura issues refresh tokens and each refresh token is single use (a refresh returns a new one); Executor's host owns refresh tokens and renews access tokens, but its docs do not state that the rotated refresh token is persisted, so this is unverified here.

**Known gaps:** the 6 webhook subscription endpoints are skipped, because they authenticate with `x-client-id` / `x-client-secret` headers rather than the user's token.

The ring configuration and ring battery tools need a `ring_configuration` scope that the official authentication page does not list and this package does not request, so they may return authorization errors. This is not verified against the live authorize flow.
