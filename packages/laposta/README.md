# Laposta

Dutch email marketing platform. This package covers lists, custom fields, segments, members (including history and bulk sync), webhooks, campaigns (create, content, test mail, send, schedule) and campaign reports.

**Interface:** hand-written tools over Laposta's REST API v2, documented at https://api.laposta.nl/doc/. Laposta publishes no OpenAPI document, so 40 of the 41 tools are a table in `routes.ts`; the bulk member sync is defined separately in `index.ts`. Create and update calls send form-encoded bodies (field updates send JSON, as documented for options_full) with PHP bracket notation (the vendor's documented format); the bulk member sync sends JSON.

**Auth:** API key. Create one in your Laposta account (see https://docs.laposta.nl/article/349-hoe-kom-ik-aan-een-api-sleutel). It is sent as the HTTP Basic username with an empty password to `api.laposta.nl`. Laposta has no OAuth. The health check lists lists.

**Notes and gaps:**
- Rate limits are 30 requests per minute on free accounts and 120 on paid accounts (HTTP 429 with `Retry-After`).
- Bulk member sync is unavailable on free accounts. Sending a campaign requires a signed data processing agreement (HTTP 402, code 214).
- Labels fields are managed by Laposta; set labels through a member's `custom_fields`.
- Mutations require approval. The account section of the vendor docs was not covered, so there are no account tools.
