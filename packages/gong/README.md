# Gong

Gong's public REST API: calls and transcripts, users, activity and interaction stats, scorecards and trackers, workspaces, library folders, coaching metrics, call outcomes, individual call access, permission profiles, Engage flows and tasks, CRM uploads, consent meetings, audit logs, data privacy and digital interactions. 60 tools (25 are mutations and always ask for approval; read-only POST endpoints such as `calls/extensive`, `calls/transcript` and the stats endpoints are queries).

## Interface

OpenAPI, from Gong's own API reference at https://help.gong.io/apidocs. Gong publishes no single downloadable spec: each operation page embeds its own OpenAPI document. `spec.ts` merges those 60 documents (official content, unchanged apart from removing spaces from two schema names the compiler cannot reference, and setting the server to `https://api.gong.io`). Regenerate it by re-merging the pages listed in https://help.gong.io/llms.txt under "v1-api".

## Auth

- **API key (`apiKey`)**: an access key and access key secret, sent as HTTP Basic auth. A Gong technical administrator creates them in Admin center, Settings, Ecosystem, API ("Get API key"); see https://help.gong.io/docs/receive-access-to-the-api.
- **OAuth (`oauth`)**: authorization code flow against `app.gong.io/oauth2/authorize` and `/oauth2/generate-customer-token` (client credentials sent as Basic auth). Gong has no dynamic client registration for the REST API: a tech admin creates an app in Admin center, Settings, Ecosystem, "Create an app for Gong" (https://help.gong.io/docs/create-an-app-for-gong), selects the scopes, and registers Executor's redirect URI shown on the connect page. Paste the client ID and secret into the connect page. The requested scopes must be enabled on the Gong app.

## Known gaps

- **OAuth base URL (unresolved)**: Gong returns `api_base_url_for_customer` (for example `https://company-17.api.gong.io`) with OAuth tokens and its docs say to call it. The framework's `allowedOrigin` is a single fixed string, so tools here always call `https://api.gong.io`. That host is reported by third parties (Tray.ai) for API-key use and is not documented by Gong, whose docs say the base URL varies per company (see https://app.gong.io/company/api-authentication). OAuth should be treated as unverified until per-account origins are supported; the API key method is the dependable one.
- **PKCE (unverified)**: Gong's docs never mention PKCE, but the host owns PKCE and a package cannot turn it off. Not tested against a real Gong account.
- Gong's official remote MCP server (`https://mcp.gong.io/mcp`, OAuth) exposes only three AI tools (`ask_account`, `ask_deal`, `generate_brief`), so the REST API was chosen. It is not wired in.
- Gong rate limits the API to 3 calls per second and 10,000 per day.
- Binary uploads (`PUT /v2/calls/{id}/media`) are exposed per the spec's multipart definition and are untested.
