# Plausible Analytics

Query Plausible Analytics stats and manage sites, goals, custom properties, guests and shared links on Plausible Cloud (`plausible.io`).

## Interface

Hand-written tools over Plausible's documented HTTP APIs, because Plausible publishes no OpenAPI document, GraphQL API or MCP server:

- Stats API v2, `POST https://plausible.io/api/v2/query` (https://plausible.io/docs/stats-api)
- Sites API v1, `https://plausible.io/api/v1/sites...` (https://plausible.io/docs/sites-api)

Tools: `stats.query`, `sites.*` (list, get, teams, create, update, delete, sharedLink), `goals.*`, `customProps.*`, `guests.*`. All mutations require approval.

## Auth

API key only (Plausible has no OAuth for third parties). In Plausible go to Settings, API Keys, New API Key, and choose "Stats API" (Business plan) or "Sites API" (Enterprise plan). The key is shown once and is scoped to the team selected at creation. A Stats API key also reads the Sites API list/get endpoints.

## Known gaps

- Plausible Cloud only; self-hosted instances on another host are not supported.
- The public Events API (`/api/event`) is not exposed; it is for tracker ingestion.
