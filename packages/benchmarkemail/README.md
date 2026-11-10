# Benchmark Email

Email marketing on the Benchmark Email REST API v3.0: contact lists, contacts, segments and webhooks, emails and templates, automations, A/B tests, campaign reports, sub-accounts and integrations.

## Interface

Benchmark publishes no OpenAPI document. Its official API reference (https://developer.benchmarkemail.com/) is a Postman collection, which `generate-openapi.mjs` converts to an OpenAPI 3.0 document (`document.json`, 345 operations, snapshot taken 2026-10-12; the collection URL uses `versionTag=latest` so it is not pinned). Paths, methods, path and query parameters, and descriptions come from the collection; request bodies are open JSON objects whose known field names come from the collection's examples, so check the operation description for required fields. Every operation is sent to `clientapi.benchmarkemail.com`, the only host declared. Three collection entries are listed on `restapi.benchmarkemail.com`: `GET /Emails/` also has a clientapi example URL in the collection, so it is kept on clientapi; `GET /Contact/{listID}/ContactDetails/ExtraFields` and `POST /Emails/{ID}/ScreenCapture` have no clientapi URL in the vendor collection and are excluded (skipped), since sending them to an undeclared host or to a host that may 404 is not acceptable. Refresh by re-downloading `https://developer.benchmarkemail.com/api/collections/1505830/RVfsHZ2Y?segregateAuth=true&versionTag=latest` and re-running the script. Mutations require approval, including `GET /Client/ConfirmedEmail/{email}` (resend confirmation email), which is marked a mutation by an explicit `kinds` override. `GET /Client/Token/{type}` returns the account Secret and Token to the agent; it is a read and not gated.

## Auth

API key only, sent in the `AuthToken` header. In Benchmark Email open Integrate > API (https://ui.benchmarkemail.com/Integrate#API) and copy the Admin API token. This key is not valid for the newer benchmarkemail.io API, which uses a different scoped `X-API-Key`. Benchmark offers no user-created OAuth apps, so OAuth is not offered. Health check: `GET /Client/ProfileDetails`.

## Icon

Benchmark's own logo mark (PNG from its brand guidelines on https://www.benchmarkemail.com/). The round version has a white disc, visible on dark backgrounds.

## Gaps

The newer benchmarkemail.io API (about 40 operations, `X-API-Key`) is not covered; no verifiable OpenAPI URL was found. Benchmark also runs an OAuth remote MCP server (https://mcp.restapi.benchmarkemail.com/mcp, Benchmark Classic login), not used here. The two restapi-only operations above are excluded. Responses are untyped (open objects). One duplicate collection entry (same method and path) was dropped. Bodies are not validated against a schema.
