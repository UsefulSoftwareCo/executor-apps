# y.gy

Short links and QR codes on y.gy: create, fetch, list, update and delete links (custom domain and suffix, password, expiry, social preview, device redirects, QR colors, bot protection, webhooks) and manage tags.

**Interface:** hand-written tools over y.gy's REST API (`https://api.y.gy/api/v1`), documented at https://app.y.gy/docs/api-docs/links and https://app.y.gy/docs/api-docs/tags. y.gy publishes no OpenAPI document, and only part of its API is public (links and tags). createTag sends `{ name }`: y.gy's attribute list uses `name`; the curl example in y.gy's tags docs shows `tag`, which looks like a doc typo. Mutations require approval.

**Auth:** API key. In the y.gy dashboard open My Account, scroll to API Keys, click Add API Key, name it and create it. Keys do not expire until deleted. The key is sent in the `api-key` header. y.gy has no OAuth for third parties.

**Known gaps:** y.gy says only a small part of its API is publicly documented; the click analytics and user endpoints are not covered. Link `created_at` uses the format `YYYY-MM-DD_HH-MM-SS`.
