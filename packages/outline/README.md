# Outline

Outline team knowledge base: documents, collections, comments, shares, users, groups, search and the rest of the Outline API (153 tools).

## Interface

OpenAPI, from Outline's official document: https://raw.githubusercontent.com/outline/openapi/main/spec3.json. The API is RPC style, so every operation is a POST; read operations (info, list, search and similar) are marked as queries by operationId and run without approval, and every other tool asks for approval.

## Auth

- API key: create one under Settings > API in Outline (https://app.getoutline.com/settings/api-and-apps). Sent as a bearer token.
- OAuth 2: create an OAuth app under Settings > Applications in Outline and enter its client ID and secret on the connect page. Add the redirect URI Executor shows to the app. Scopes: `read write`.

## Known gaps

Only Outline Cloud (`app.getoutline.com`) is supported. Self-hosted instances use another origin and are not covered.
