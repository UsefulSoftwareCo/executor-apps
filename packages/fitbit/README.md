# Fitbit

Reads and writes Fitbit and Google Health data: steps, sleep, heart rate, exercise, weight, distance, active zone minutes, oxygen saturation, VO2 max, profile, settings and paired devices. 15 tools: profile, settings, identity, devices and `dataPoints` (list, reconcile, get, rollUp, dailyRollUp, exportExerciseTcx, create, patch, batchDelete).

## Interface

Hand-written tools over the Google Health API (`https://health.googleapis.com/v4`), documented at https://developers.google.com/health. The legacy Fitbit Web API (`api.fitbit.com`) is shut down on 30 October 2026 and publishes no OpenAPI document, so this package targets its official successor. Google serves a Discovery document at `https://health.googleapis.com/$discovery/rest?version=v4` but no OpenAPI conversion exists yet, so the tools are written by hand from it. Mutations require approval.

## Auth

OAuth 2.0 with Google (`discover: https://accounts.google.com`, offline access). Create an OAuth client in the Google Cloud console, enable the Google Health API, and register this Executor's callback as an authorized redirect URI (the connect page shows it). Users sign in with the Google account linked to their Fitbit. Existing Fitbit OAuth tokens do not carry over. Scopes: activity_and_fitness, health_metrics_and_measurements, sleep, profile and settings (read and write) plus nutrition write.

## Known gaps

- Nutrition read, ECG, irregular rhythm, location, mindfulness, symptom and reproductive health scopes are not requested (nutrition.readonly is documented but missing from Google's Discovery document).
- Webhook subscriber and subscription management (project-level, developer credentials) and Smart Health Links are not exposed.
- Request bodies for rollUp, create, patch and batchDelete are passed as JSON; see the Google Health API reference for their shapes.
- Google may require app verification for sensitive health scopes.
