# Cloudflare

Zones, DNS, Workers, R2, Zero Trust, firewall and WAF, caching, load balancing, Pages, Images, Stream and the rest of Cloudflare, through Cloudflare's official remote MCP server (mounted under `mcp`) and, for API-token accounts, one tool per REST operation (mounted under `api`, 2,425 tools, 1,299 of them mutations that ask for approval).

## Interface

MCP: https://mcp.cloudflare.com/mcp (source and docs at https://github.com/cloudflare/mcp). It is a Code Mode server: `search` and `execute` reach the whole Cloudflare API through code run in a sandbox, and `docs` searches Cloudflare's documentation. Tools are listed live; every tool without `readOnlyHint` asks for approval. Only unauthenticated probing was done (401 with valid OAuth metadata); the tool list is unverified.

REST: OpenAPI. Cloudflare's official, machine-generated description is published at
https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json
(repository `cloudflare/api-schemas`, base URL `https://api.cloudflare.com/client/v4`). The document is about 27 MB; tools are compiled live from it.

## Auth

- **OAuth** (`oauth`, first): the MCP server's own authorization server, discovered from its protected-resource metadata. It supports dynamic client registration and Client ID Metadata Documents, so no OAuth app has to be created. The user picks the token's permissions on Cloudflare's consent screen (Executor asks for the challenge's `user:read account:read` plus `offline_access`); the server reports a missing permission in the tool error. Its tokens only work on the MCP server, so these accounts get the `mcp` tools. Health check: an MCP initialize and tool listing.
- **User API token** (`apiToken`): create one at https://dash.cloudflare.com/profile/api-tokens (User API Tokens, "Create Token"), scoped to the zones and permissions you want. Sent as `Authorization: Bearer <token>`. Health check: `GET /user/tokens/verify`.
- **Account API token** (`accountToken`): create one under Manage Account > API Tokens (the service-token option for long-lived integrations; tokens start with `cfat_`). Enter the token and the 32-character account ID. Health check: `GET /accounts/{account_id}/tokens/verify`. Both endpoints need no extra permission and return `result.id` and `result.status`. Cloudflare's MCP server takes both kinds of token as bearer tokens, so token accounts get both `mcp` and `api` tools.

## Known gaps

- 1,342 operations are skipped because their security requirement cannot be met with a bearer token: `auth_method` (1,333) are operations that require the legacy global API key plus account email (`X-Auth-Key` / `X-Auth-Email`) or the Origin CA service key, and `multiple_hosts` (9) use a different origin.
- The legacy global API key is deliberately not offered; scoped API tokens are Cloudflare's recommended method.
