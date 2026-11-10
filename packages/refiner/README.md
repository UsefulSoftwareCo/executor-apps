# Refiner

Refiner is an in-app survey and customer feedback platform. This package covers its REST API: surveys (forms) and their change log, survey responses (list, store, tag), NPS/CSAT/rating reporting, contacts, user identification, event tracking, segments and account usage. 18 hand-written tools.

## Interface

Hand-written tools over the REST API at `https://api.refiner.io/v1`, documented at https://refiner.io/docs/api/. Refiner publishes no OpenAPI document. Its OAuth MCP server (`https://app.refiner.io/v001/mcp`) was probed but exposes only read scopes (projects, forms, responses, reporting), so the REST API, which also writes, is used instead.

## Auth

API key. Create it in the Refiner dashboard under Environment Settings > API Keys. Keys are per environment. It is sent as a Bearer token to `api.refiner.io`. Health check calls `GET /v1/`.

## Gaps

- No survey creation or editing (the API only publishes, duplicates and archives forms).
- The MCP server's OAuth is not offered.
- Mutations (including identify, track and store response) always ask for approval.

Notes: storeResponse and identifyUser send form-encoded bodies with bracket keys (`account[id]`, `account[name]`), matching the examples in the Refiner API docs. The icon is the mark only (first two paths) of the official logo at https://refiner.io/images/logo.svg, with the viewBox set to contain it.
