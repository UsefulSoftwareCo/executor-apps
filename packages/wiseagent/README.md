# Wise Agent

Wise Agent is a real estate CRM. This package covers its contacts, vendors, categories, notes, calls, tasks, calendar, properties, property search profiles, marketing programs, content and webhooks with 49 hand-written tools.

**Interface:** custom tools over the official Wise Agent developer API (`https://sync.thewiseagent.com/http/webconnect.asp`, operations selected by `requestType`), documented at https://wiseagent.com/docs/api.asp. Wise Agent publishes no OpenAPI document or MCP server.

**Auth:** OAuth 2.0 authorization code flow only (scopes `profile team marketing contacts properties calendar`, no PKCE, JSON token requests, refresh supported). The docs describe no API key or static token: the only Basic header is an optional way to send the client ID and secret to the token endpoint. Wise Agent issues OAuth client ID and secret only to larger partner integrations, platforms and vendors ("we don't issue API credentials to individual teams or agents"): ask Wise Agent support, giving an app name, a public logo URL, the redirect domain and the scopes you need. Use Executor's OAuth callback URL as the redirect.

**Hosts:** the docs put the OAuth endpoints on `sync.wiseagent.com/WiseAuth/{auth,token,revoke}` and the API on `sync.thewiseagent.com`. The package follows the vendor docs, and `hosts` lists both domains.

**Known gaps:** the docs for the DELETE operations (calls, notes, tasks, webhooks, properties) and several PUT operations are truncated, so no delete tools are included. `register` and `addVisitedWebsite` (uses a separate API key and host) are not exposed. Without partner credentials the package cannot be connected, so it was verified only by typecheck and deploy.
