# Tableau

Workbooks, views (data as CSV, PNG and PDF export), data sources, Prep flows, projects, users, groups, jobs, schedules, subscriptions, tags and permissions on Tableau Cloud, plus read-only queries against the Metadata API (GraphQL).

## Interface

Hand-written tools over the Tableau REST API (`https://<server>/api/<version>/...`, https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref.htm) and the Metadata API (`https://<server>/api/metadata/graphql`). No official OpenAPI document was found (none verified). Tableau does publish an official MCP server (tableau/tableau-mcp, Apache-2.0), including a hosted remote server at https://mcp.tableau.com for Tableau Cloud that uses OAuth 2.1. It was not used because it covers Tableau Cloud only, exposes fewer tools than this package, and does not cover Tableau Server. About 60 of the most used operations are therefore written by hand. The Refresh Extracts endpoints (`POST .../workbooks/{id}/refresh`, `.../datasources/{id}/refresh`), the JSON form of the tag bodies and the view data/image/pdf endpoints follow the REST reference but were not independently confirmed against live responses. Every mutation requires approval. The REST API has many more endpoints (publishing files, custom views, data alerts, webhooks); they are not covered.

## Auth

Personal access token. In Tableau, open Account Settings, Personal Access Tokens, create a token and copy its name and secret (https://help.tableau.com/current/server/en-us/security_personal_access_tokens.htm). The connect form asks for:

- `server`: the Tableau Cloud pod URL (must be under `online.tableau.com`), for example `https://10ax.online.tableau.com`.
- `site`: the site's content URL (the part after `/site/` in the browser address bar); leave empty for Tableau Server's Default site.
- `apiVersion`: the REST API version of the server, for example `3.27` (Tableau Cloud 2025.3). Tableau Server needs the version matching its release (https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_concepts_versions.htm).
- `tokenName` and `tokenSecret`.

The app signs in with `POST /auth/signin` (the health check signs out again) and sends the returned credentials token in `X-Tableau-Auth`. A token allows one session at a time, so the app reuses a single session per account and signs in again on a 401. The hosted Tableau MCP server uses OAuth 2.1, but this package uses the REST API with a personal access token. The session cache key omits the secret, so a rotated secret under the same token name keeps the old session until a 401.

## Known gaps

- Hosts are limited to `*.online.tableau.com` (Tableau Cloud pods), so the token secret stays a handle. Tableau Server on a user-supplied host is not covered: the framework declares provider hosts statically, and requests elsewhere are refused.
- Content publishing (uploads), downloads of workbook or data source files, custom views, webhooks and data alerts are not exposed.
