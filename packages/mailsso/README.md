# Mails.so

Email validation with [Mails.so](https://mails.so): validate a single address (result, reason, score, MX, catch-all, generic, free-provider and block-list flags) and run asynchronous bulk validation jobs.

**Interface:** custom tools written with `fetch` against the REST API documented at https://docs.mails.so (`GET /v1/validate`, `POST /v1/batch`, `GET /v1/batch/{id}` on `https://api.mails.so`). Mails.so publishes no OpenAPI document, GraphQL API or MCP server.

**Auth:** API key. Create it in your Mails.so dashboard (https://mails.so); it is sent in the `x-mails-api-key` header. The API offers no OAuth.

**Notes and gaps:**
- The API has no account endpoint. The health check looks up a nonexistent batch job (free, read-only, no credit spent). The docs return 401 both for a bad key (`Unauthorized.`) and for a valid key on a free plan (`Paid subscription required to use list validations`), so the check reads the 401 body and fails only when it is not the paid-subscription message. The alternative, `GET /v1/validate`, would spend a validation credit on every check.
- The exact `/v1/validate` path and `x-mails-api-key` header were spot-checked against https://docs.mails.so/single; the batch endpoints and 401 bodies against https://docs.mails.so/bulk.
- Bulk validation requires a paid Mails.so subscription.
- Credit balance and other dashboard features are not exposed by the public API, so they are not covered.
- Response schemas are taken from the docs; results are returned as raw JSON.
- The icon is the Mails.so logo (envelope with a handwritten stroke) from https://docs.mails.so/img/logo.svg, which embeds a PNG. The black stroke vanishes on dark backgrounds, so the PNG is flattened onto a white rounded square (a single variant visible on light and dark).
