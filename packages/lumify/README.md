# Lumify

Sports intelligence from [Lumify](https://lumify.ai): sports and seasons, events, live scores, odds and line movement, public betting splits, injuries, stats, player and team props, players and teams, entity resolution, bet slip grading, explainable bet confidence (intelligence, EV, forecasts) and webhook subscriptions.

## Interface

OpenAPI, from Lumify's official document at https://lumify.ai/openapi.json (41 tools, 13 of them POST/DELETE and gated by approval). The document also describes Lumify's website (login, dashboard, billing, admin); website, admin, billing-page and webhook paths are removed. Exposed are the `/v1` API and the bearer-authenticated `/api/agent/*` operations (list, create and delete API keys, check credits, list credit packs, and credit top-up). Creating or deleting keys and topping up credits (which spends money) are mutations and ask for approval. Lumify also runs an official MCP server at https://lumify.ai/mcp (23 tools); the OpenAPI surface is larger, so it is not mounted.

## Auth

API key (`apiKey`), sent as `Authorization: Bearer lmfy-...`. Create one in the Lumify dashboard under API keys (https://lumify.ai/api-keys). Lumify has no user-created OAuth apps. Requests consume credits.

## Known gaps

`/v1/events/{event_id}/stream` is a server-sent event stream and does not suit a request/response tool, so it is removed from the tool surface. The POST endpoints (`query`, `batch`, `resolve`, `estimate`, `grade`) read data but are classed as mutations by the framework, so they ask for approval.
