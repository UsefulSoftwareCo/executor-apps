# Teamcamp

Manage Teamcamp, the project management tool: verify the key, list workspace users and customers, create, read, update and delete projects, list project groups, and create, read and update tasks and post task comments.

## Interface

OpenAPI. Teamcamp publishes one OpenAPI document per area of its public beta API, all fetched from `https://api.teamcamp.app/api-reference/<area>/<area>-api.json` (auth, company, project, projectGroup, task). The vendor's llms.txt lists these under `docs.teamcamp.app/api-reference/...`; the `api.teamcamp.app` paths are the mirror that resolves and serve the same specs. The package mounts each under its own key (`auth`, `company`, `projects`, `projectGroups`, `tasks`). Two operations (get current project details, update task) are served from `back.teamcamp.app` per the specs, so the project and task specs are mounted a second time (`projectDetails`, `taskUpdates`) with that origin. The combined `openapi.json` in the same directory is a placeholder sample (a plant store) and is not used. Mutations require approval.

## Auth

API key. Create it at https://dash.teamcamp.app/settings/apikey. It is sent in the `apiKey` header to `api.teamcamp.app`. The health check calls `GET /v1.0/verify`. Teamcamp offers no OAuth for third parties.

## Known gaps

The API is in beta and small (about 15 operations): no task deletion, time tracking, or webhooks. The vendor specs declare the key scheme as `bearerAuth` but it is an `apiKey` header; the package overrides the scheme accordingly. The icon is the vendor's 132px app icon (PNG, converted from palette to RGBA so the dark variant is generated and inverted); the mark is solid on both light and dark tiles.
