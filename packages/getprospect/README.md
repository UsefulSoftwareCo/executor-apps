# GetProspect

Find and verify business emails, enrich and search people and companies, save
leads, manage blocklists, email verifications, webhooks, credits and usage with
[GetProspect](https://getprospect.com).

**Interface:** OpenAPI. GetProspect's official v2 document at
https://api.getprospect.com/v2/openapi.json, served from the API host
`https://api.getprospect.com`. Approval is required for every
non-GET operation (including read-only POST searches, which is deliberate
over-gating) and for the two GET operations that spend credits,
`GET /v2/email-finder` (`email.findGet`) and `GET /v2/email-verifier`
(`email.verifyGet`).

**Auth:** API key. Copy it from GetProspect under Settings > API (older
accounts: Settings > Integration) and send it as the `x-api-key` header. The
spec also declares an OAuth 2.0 authorization-code flow, but it is for
third-party apps registered with GetProspect (Zapier, the Sheets add-on) and
has no self-service app registration or scopes, so it is not offered.

**Gaps:** enrich, email-reveal, email-finder and email-verifier endpoints spend
GetProspect credits (the spec's `x-credit-cost`). The spec has 52 operations and
51 become tools: `GET /v2/events` is omitted because it is a realtime
`text/event-stream` streaming endpoint, which tools cannot consume. The
health check calls `GET /v2/me`.

Icon: GetProspect's own favicon.svg (owl mark).
