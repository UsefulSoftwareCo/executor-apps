# Apify

Covers the Apify platform API v2: Actors (runs, builds, versions), tasks, runs, datasets, key-value stores, request queues, schedules, webhooks, the Store, and user/account endpoints. 231 tools, all generated at runtime from Apify's official OpenAPI document: https://docs.apify.com/api/openapi.json (single origin `api.apify.com`, no skipped operations). Every mutation requires approval.

## Auth

Two methods. API token: create it in Apify Console under Settings > API & Integrations (https://console.apify.com/account#/integrations); it is sent as a Bearer token to `api.apify.com` only. OAuth 2.0: Apify supports it (https://docs.apify.com/platform/integrations/integrate) and publishes RFC 8414 metadata at https://api.apify.com/.well-known/oauth-authorization-server. Authorization is at `console.apify.com/authorize/oauth`, the code exchange and refresh go to `console-backend.apify.com/oauth/apps/token` (declared in `hosts`), with PKCE S256 and the single scope `full_api_access`. The connect page asks for an OAuth client; Apify exposes dynamic client registration at `console-backend.apify.com/oauth/apps`, and the redirect URI to register is the one Executor's connect page shows. The OAuth path has not been verified end to end with a real account. The health check calls `GET /v2/users/me`.

## Notes

- The icon is the official Apify symbol (https://apify.com/img/apify-logo/apify-symbol-200x200.svg); Simple Icons has no Apify entry. It is multi-colour, so the same mark is used for light and dark.
- Apify also runs a hosted MCP server at https://mcp.apify.com/ (not used; the OpenAPI route exposes more tools).
- Known gap: the spec also allows a `?token=` query parameter; only the Bearer header is used.
