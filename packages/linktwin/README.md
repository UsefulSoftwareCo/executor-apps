# LinkTwin

Create and manage LinkTwin deep links and short links (with geo, device, language and A/B targeting, UTM parameters, expiry and passwords), branded domains, tracking pixels, QR codes and collections.

## Interface

Hand-written tools over LinkTwin's REST API at `https://linktw.in/api`, documented at https://linktw.in/developers. LinkTwin publishes no OpenAPI document, and its MCP server (`@linktwin/mcp`) is a local stdio process, not a remote server, so neither could be mounted. The tools cover the endpoints in the vendor's developers page (links, domains, pixels, QR codes, collections) plus the statistics and account endpoints that the vendor's official client (`@linktwin/client` 1.0.0) calls: dashboard, detailed, per-link and day-trend statistics, account details, account settings and workspace switching (35 tools). `DELETE /account` is deliberately not exposed because it is irreversible. Mutations require approval.

## Auth

API key (`Authorization: Bearer <key>`). LinkTwin generates a key for each account on registration; the vendor's docs do not say where it is shown in the dashboard (the vendor client describes it only as the Bearer token on the Settings page). LinkTwin offers no OAuth for third-party apps. The health check calls `GET /api/account`, as the vendor's official client does. (The developers page shows a POST example, but the live API enforces auth on GET and rejects POST.) Error bodies of the form `{error: 1, message}` are reported as errors even on HTTP 200, and a 429 is reported as a rate-limit error.

## Known gaps

- Direct image upload for a link's `metaimage` (multipart) is not exposed; pass a public `.jpg` or `.png` URL.
- Responses are returned as the API sends them; their shapes are not published as a schema.
- Rate limit is 120 requests per minute.
