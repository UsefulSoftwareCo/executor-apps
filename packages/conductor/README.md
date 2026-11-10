# Conductor

Covers [Conductor](https://www.conductor.build) (the coding-agent workspace app, not conductor.com's SEO platform): projects, cloud workspaces, agent sessions, messages, sections, routines, favorite models and SQL transcript search.

Interface: OpenAPI, compiled live from Conductor's official document at https://api.conductor.build/v0/openapi.json (docs: https://www.conductor.build/docs/api). The document declares no servers, so `baseUrl` is set to `https://api.conductor.build`. Every mutation requires approval.

Auth: API key only (Bearer). Create one at https://app.conductor.build/home/api-keys; a Conductor Pro account is required. Conductor documents no OAuth for third-party apps on the REST API.

Known gaps: Conductor also runs an MCP server at https://api.conductor.build/mcp; it mirrors the REST endpoints, so it is not mounted. Many operations are marked experimental by Conductor and may change.
