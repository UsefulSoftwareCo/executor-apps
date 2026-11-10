# Async Interview

Manage Async Interview, the on-demand video interview platform: list, update and delete interview jobs, and list candidate interview responses with candidate details.

## Interface

Hand-written tools over the REST API at `https://app.asyncinterview.ai/api` (four operations: `jobs.list`, `jobs.update`, `jobs.delete`, `interviews.list`). Async Interview publishes no OpenAPI document, GraphQL API or MCP server and no public API reference page, so the endpoints and the bearer-token scheme come from public integration references (Pipedream's code samples) and are unverified against vendor docs. The response shapes are passed through unchanged. Updates and deletes mutate data and always ask for approval.

## Auth

API token (`apiKey`), sent as `Authorization: Bearer <token>`. Create it in your Async Interview account at https://app.asyncinterview.ai (API or integrations settings). The vendor documents no OAuth for third-party apps, so none is offered.

## Known gaps

- Only the four operations above. Creating jobs, inviting candidates and webhooks are not exposed because no public endpoint documentation exists.
- The health check lists jobs; any non-2xx response fails the check.
- Icon is the vendor's square logo PNG from asyncinterview.io. The light variant is the original dark green; the dark variant is the same shape recolored to a light mint tint so it stays visible on dark tiles.
