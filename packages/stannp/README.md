# Stannp

Send direct mail with Stannp: postcards, letters and SMS, recipients and groups, campaigns (create, sample, cost, approve, book), recipient events, address validation, reporting and file uploads.

**Interface:** hand-written tools over Stannp's REST API, from the official reference at https://www.stannp.com/us/direct-mail-api/guide (machine-readable copy at https://www.stannp.com/stannp-api-llm.md). Stannp publishes no OpenAPI document, no GraphQL API and no MCP server (checked the API guide and stannp-api-llm.md above; neither links one). Requests are form-encoded, as the API expects. Read-only tools (including the POST calls that only compute, such as `addresses.validate`, `campaigns.cost` and `campaigns.sample`, which returns a PDF link valid for 30 minutes) run without approval; every other mutation asks first, including `pdf/merge`, which returns a hosted file URL and is not documented as side-effect free.

**Auth:** API key only; Stannp has no OAuth for customers. Copy the key from the bottom of Settings > API in the Stannp dashboard (https://app-us1.stannp.com/settings/api or the EU/UK equivalent). The connect form also asks for a region: `us` for US/CA accounts (`api-us1.stannp.com`) or `eu` for EU/UK accounts (`api-eu1.stannp.com`). The key is sent as the HTTP Basic username with an empty password.

**Known gaps:** `qrcode/create` needs a separate public key and returns binary JPEG, so it is not exposed. Webhooks are configured in the Stannp dashboard and have no API. Repeating an identical request with the same `idempotency_key` returns HTTP 409 carrying the original response body; the tool surfaces this as an error and the original result is not returned to the caller.
