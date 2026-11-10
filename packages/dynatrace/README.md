# Dynatrace

Observability with the Dynatrace Environment API v2: Davis problems (list, inspect, comment, close), monitored entities and tags, metric descriptors and queries, custom metric ingest, events, logs, SLOs, security problems, Settings 2.0 objects, audit logs, releases, extensions, synthetic locations, network zones and API token metadata (38 tools).

## Interface

Hand-written tools over the official Environment API v2 (https://docs.dynatrace.com/docs/discover-dynatrace/references/dynatrace-api/environment-api). Dynatrace publishes its OpenAPI document only from inside each tenant (the API explorer, `https://<environmentId>.live.dynatrace.com/api/v2/spec3.json`), not at a stable public URL, so an OpenAPI package cannot load it without credentials. The official Dynatrace MCP server is a local stdio server (and its remote gateway is per tenant), so it is not used either.

## Auth

API token only. Create it in Dynatrace under Access tokens (Settings > Access tokens > Generate new token) and grant the scopes for the tools you want (for example `problems.read`, `entities.read`, `metrics.read`, `events.read`, `logs.read`, `slo.read`, `settings.read`). Write tools need the matching write/ingest scopes (`problems.write`, `entities.write`, `metrics.ingest`, `events.ingest`, `logs.ingest`, `settings.write`). Enter the environment ID, the subdomain of `https://<environmentId>.live.dynatrace.com`. The token is sent as `Authorization: Api-Token <token>` only to that host. The account is checked with a read of `/api/v2/entityTypes`, so the token needs `entities.read`; tokens scoped only to other APIs (for example `problems.read`) will fail the account check even though their tools work. Dynatrace has no scope-free endpoint to check against. The provider declares `hosts: ["*.live.dynatrace.com"]`, so the token is only ever sent to a tenant host.

Dynatrace's OAuth (client credentials) flow is for the account-management API on `api.dynatrace.com` and platform APIs, which need an account UUID and are not covered here: the account-management API is a different surface (accounts, users, groups, environments) from the Environment API v2 tools in this package, so it would need its own tool set and an account UUID field.

## Gaps

- SaaS tenants on `live.dynatrace.com` only (not Managed, sprint or other domains).
- Environment API v1, Configuration API and Grail/platform APIs (DQL, dashboards, workflows) are not exposed.
