# Rootly

Incident management with Rootly: incidents, alerts, on-call schedules and escalation policies, retrospectives, action items, status pages, workflows, teams and services.

## Interface

OpenAPI, from the document Rootly publishes at https://rootly-heroku.s3.amazonaws.com/swagger/v1/swagger.json (API origin `https://api.rootly.com`; the vendor's own link, https://rootly.com/swagger/v1/swagger.json, returned 403 to non-browser clients). Rootly also runs a hosted MCP server (`https://mcp.rootly.com/mcp`), which was not counted; the OpenAPI document is used because it gives complete, directly generated coverage of the REST API (598 operations).

## Auth

Two methods, both sent as `Authorization: Bearer` to `api.rootly.com`.

- API key: create one in Rootly under Organization dropdown > Organization Settings > API Keys (Global, Team or Personal).
- OAuth 2.0: Rootly publishes metadata at https://rootly.com/.well-known/oauth-authorization-server (authorization `https://rootly.com/oauth/authorize`, token `https://rootly.com/oauth/token`). Create an OAuth app under Organization Settings > OAuth Applications, or register a client through the dynamic registration endpoint (`https://rootly.com/oauth/register`, RFC 7591). Set the app's redirect URI to the callback URL shown on Executor's connect page. The requested scope is `all`, Rootly's non-admin scope covering the incident and on-call APIs the tools use; narrower `ir.*` and `oc.*` scopes exist if you want to restrict it.

Credentials also go to `rootly.com`, which hosts the OAuth token endpoint.

## Gaps

The JSON:API request bodies are passed as the spec describes them. The per-status-page public API on custom domains is not included.
