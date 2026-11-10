# Jungle Scout

Amazon seller research through the Jungle Scout API: keywords by ASIN or keyword, historical search volume, product database queries, sales estimates and share of voice (6 operations).

**Interface:** OpenAPI. Jungle Scout's official document at https://developer.junglescout.com/api-docs/v1/swagger.json (docs: https://developer.junglescout.com/api).

**Auth:** API key only; Jungle Scout has no OAuth. Create a key on the Developer page of your Jungle Scout account (two-factor authentication must be on). You receive a key name and an API key; enter them joined by a colon as `KEY_NAME:API_KEY`, with no spaces. The package sends that as `Authorization` plus the required `X-API-Type: junglescout` and v1 `Accept` headers.

**Known gaps:** The POST product database and keyword queries only read data but are approval-gated because they are mutations in the spec. Enterprise (Cobalt) keys use `X-API-Type: cobalt` and are not supported. API access requires a plan that includes it.
