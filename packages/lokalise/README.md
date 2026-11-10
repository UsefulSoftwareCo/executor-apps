# Lokalise

Manage Lokalise localization projects: keys, translations, files (upload and download), tasks, contributors, languages, glossary, screenshots, snapshots, comments, webhooks and team users and groups.

## Interface

OpenAPI, from Lokalise's official "Default projects" document: https://developers.lokalise.com/openapi/lokalise-api-without-branches.yml (server `https://api.lokalise.com/api2`). Mutations require approval.

## Auth

- API token (`X-Api-Token`): create one under Profile settings > API tokens in Lokalise. Read-only tokens work for reads; write tools need a read/write token. Tokens inherit the creating user's permissions.
- OAuth 2: register an OAuth 2 app in Lokalise (Profile settings > Apps > OAuth 2 apps) and enter its client ID and secret on the connect page. Add Executor's redirect URI to the app's allowed redirect URIs. Endpoints are `https://app.lokalise.com/oauth2/auth` and `/oauth2/token`; requested scopes cover read/write on projects, keys, translations, files, tasks, contributors, languages, glossary, screenshots, snapshots, comments, webhooks, team users and groups. Payment cards, team orders and billing scopes are not requested.

## Known gaps

- The branch-aware document ("Projects with branches") is not mounted. Branch management (create, list, retrieve, merge, delete branches) and branch-scoped key, file and comment operations (`:{branch}` path variants) are therefore not available.
- The OTA (over-the-air) API has its own host and auth and is not included.
- `GET /users/me`-style user retrieval is not available to OAuth tokens, so the health check lists projects instead.
