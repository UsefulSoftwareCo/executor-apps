# OpenFunnel Agent Primitives

Company and people search, lookalikes, tech-stack search, deep research, lookup, enrichment, signal deployment, audiences, saved views, ICPs, CRM sync and credits for GTM agents, via the OpenFunnel API.

Interface: OpenAPI, the vendor's own document at https://api.openfunnel.dev/openapi.json (official; 91 tools). The hosted MCP server at https://agents.openfunnel.dev/mcp uses OAuth sign-in and exposes only a subset of these primitives, so it is not used.

Auth: API key (`X-API-Key` header). Get one from your OpenFunnel account at https://app.openfunnel.dev, or self-serve through the agent sign-up flow: `POST /api/v1/agent/sign-up`, then `POST /api/v1/agent/verify` with the emailed code. Both unauthenticated operations are exposed as tools (approval required, since they are mutations). Per the vendor docs at https://docs.openfunnel.dev, the key returned by verify is shown only once and cannot be retrieved later (calling sign-up again with the same email recovers a lost key). OAuth is not offered.

Known gaps: 8 operations are skipped because the spec declares only HTTPBearer security for them and the generator has no bearer method: `GET /api/v1/verticals`, `/verticals/{vertical_id}/event-types`, `/accounts/find`, `/accounts/search-events`, `/people/find`, `/accounts/{account_id}`, `/accounts/{account_id}/events` and `/people/{person_id}/events`. The vendor docs say `X-API-Key` is used on every endpoint, so these may be stale spec entries. `accounts/find` and `people/find` are the most useful of the eight and are currently unreachable through this package. Sign-up, verify and the CSV export endpoints are not skipped; they are included as tools.

The spec lists `X-User-ID` as an optional header on most operations; this package does not support it (it is not required, and the vendor docs never mention it). Many calls spend credits; all mutations (including async job starts and signal deployments) require approval.
