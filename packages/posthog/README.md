# PostHog

Product analytics, HogQL/SQL queries, insights, dashboards, feature flags, experiments, surveys, session replay, error tracking, logs, LLM analytics, data warehouse, notebooks, workflows and the rest of what PostHog's own MCP server exposes (about 1,100 tools in PostHog's published definitions; the server filters them by the account's scopes and feature flags). Read-only tools (`readOnlyHint`) run without approval; every other tool asks.

## Interface

PostHog's official remote MCP server, `https://mcp.posthog.com/mcp` ([docs](https://posthog.com/docs/model-context-protocol), [source](https://github.com/PostHog/posthog/tree/master/services/mcp)). One endpoint serves US and EU Cloud: PostHog routes each account to its own region.

PostHog's full REST OpenAPI document (2,337 tools) was used before, but its tool listing is 35.7 MB and fails on hosted Executor (see `catalog/cloudflare-large-specs.md`). No subset of it is mounted alongside the MCP server: the MCP server already covers the same products, and a hand-picked OpenAPI subset would duplicate it.

## Auth

- **Personal API key** (`apiKey`): create a key with the **MCP Server** preset at https://app.posthog.com/settings/user-api-keys?preset=mcp_server (EU: https://eu.posthog.com/settings/user-api-keys?preset=mcp_server). The preset scopes the key to one project. Sent as `Authorization: Bearer`, as PostHog's MCP docs describe.
- **OAuth** (`oauth`): discovered from the MCP server's protected-resource metadata (authorization server `https://oauth.posthog.com`, which routes to US or EU). Executor registers a public PKCE client through dynamic client registration (`tokenEndpointAuthMethod: none`; the server advertises none, client_secret_post and private_key_jwt). If you register an OAuth app by hand (Settings > User > OAuth applications), add the redirect URI Executor shows on the connect page. 153 scopes are requested: the server's `scopes_supported` minus `introspection`, `organization:write`, `user:write` and `access_control:write`.

Health check: `mcpHealth` (initialize and list tools with the account's credentials).

## Known gaps

- About 26 tools need the admin scopes left out above (reverse proxies, 2FA enforcement, identity provider configs, access-control rule sets, reminders and user settings). They fail over OAuth; a personal API key works only for the scopes it was created with.
- Some tools are LLM-backed and count as PostHog AI usage; they need AI data processing enabled for the organization.
- The event capture API (`/capture`, `/batch`) is not part of the MCP server, so events cannot be sent.
- Self-hosted PostHog is not supported.
- The tool count was not listed live (listing needs a real account); the number above comes from PostHog's `services/mcp/schema/tool-definitions-all.json` at commit `62ef2af`.
