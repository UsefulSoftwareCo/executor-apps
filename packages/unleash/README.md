# Unleash

Feature flags on your own Unleash instance (self-hosted or Unleash's hosted cloud): projects, flags, environments, strategies, segments, contexts, tags, API tokens, users, groups, change requests, metrics and more.

## Interface

OpenAPI. Unleash publishes the Admin API as an OpenAPI 3.1 document at https://docs.getunleash.io/openapi/admin-api.json (also served by each instance at `<your-unleash-url>/docs/openapi.json`). The package loads the vendor's published document and points it at the instance URL you connect. The published document also contains 17 non-admin operations (login, password reset, invite signup, health/ready, client and Edge SDK endpoints, signal endpoints); these are removed with spec patches so only admin-token operations are mounted.

## Auth

API token only. Create a personal access token (Profile > View profile settings > Personal API tokens) or, preferably for integrations, a service account token (Admin settings > Service accounts), see https://docs.getunleash.io/api/admin-api-overview. Connect with the instance URL (for example `https://us.app.unleash-hosted.com/<name>`, include any path prefix) and the token, sent as the raw `Authorization` header. The Admin API docs describe no OAuth flow.

## Known gaps

- The instance URL must use https; http URLs are rejected so the token is never sent in plaintext.
- Instances live on arbitrary domains, so the provider declares no `hosts` allow-list; the token goes to the URL you enter.
- The published document tracks the latest Unleash release; operations newer than your instance return 404.
