# Honcho

Honcho is a memory and reasoning layer for stateful AI agents. This package covers the Honcho v3 API: workspaces, peers, sessions, messages, conclusions, scopes, search, context, and webhooks.

Interface: OpenAPI, from the vendor's own document at https://honcho.dev/docs/v3/openapi.json (served from https://api.honcho.dev). The mutations are approval-gated.

Auth:
- API key: create one in the Honcho dashboard at https://app.honcho.dev under "API KEYS" (per Honcho's quickstart) and paste it as the API key. It is sent as a bearer token to api.honcho.dev.
- OAuth: sign in with Honcho (`oauth2` discovered from https://api.honcho.dev/.well-known/oauth-authorization-server; scopes `read` and `write`; authorization code with PKCE, public client with no secret). Honcho advertises a dynamic registration endpoint (https://api.honcho.dev/oauth/register), so Executor registers its own client and the user does not create an OAuth app or enter a client ID. If registration is refused, the connect page falls back to asking for a client ID. The redirect URI is shown on the connect page.

Honcho's hosted MCP server (https://mcp.honcho.dev) accepts either OAuth or an API key as a bearer token. It is not mounted here because the REST API is the superset.

Known gaps:
- The two chat operations (`POST /v3/workspaces/{workspace_id}/chat` and `POST /v3/workspaces/{workspace_id}/peers/{peer_id}/chat`) are not exposed as tools. They return either JSON or a `text/event-stream`, and the OpenAPI importer drops them without reporting a skip. The package has 53 of the spec's 55 operations.
- Only the hosted SaaS origin is supported (no self-hosted base URL).
- Several read operations (`list`, `query`, `search`) are POST requests and so are treated as mutations and require approval.
