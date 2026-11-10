# SatisMeter

Read SatisMeter surveys, responses and statistics, manage survey users and the unsubscribed email list, and track user events.

**Interface:** hand-written tools over SatisMeter's own REST API (`https://app.satismeter.com`). The v3 read API (projects, surveys, responses, statistics) is documented in the OpenAPI document that SatisMeter serves only embedded in the Redoc page at https://app.satismeter.com/apidoc; it has no stable spec URL and only six operations, so the tools are written by hand. The users, track-event and unsubscribe endpoints come from the SatisMeter help center (https://support.satismeter.com/hc/en-us/categories/6972865795091-API-Developer-support).

**Auth:** API key. In SatisMeter open Settings > Integrations > API, copy the project's API key and paste it and the project id (shown on the same page) into the account form. New projects must use this key: the read key and write key return 403 on these endpoints. Tools still take a projectId input, so one account can read any project the key authorizes.

**Gaps:**
- The insert-response API is not included: it authenticates with the project write key in the request body rather than the API key.
- Surveys, ids and users are addressed per project; there is no endpoint to list projects, so supply the project id.
- The health check requests `GET /api/v3/projects/{projectId}` with the account's project id and requires a 2xx (the apidoc documents 403 for an invalid key and 404 for an unknown project). It has not been run against a live key.
