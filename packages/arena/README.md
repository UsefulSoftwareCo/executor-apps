# Are.na

Collect and organize ideas on Are.na: channels, blocks, connections, comments, groups, users, feeds, notifications and search.

Interface: OpenAPI, built from Are.na's official v3 document at https://api.are.na/v3/openapi.json (37 of 41 paths, host `api.are.na`; the OAuth token, OpenAPI document and ping routes are removed as non-account plumbing). Every mutation asks for approval.

## Auth

- Personal access token: create one at https://www.are.na/developers/personal-access-tokens. Choose the `write` scope for write tools; the default `read` scope returns 403 on mutations.
- OAuth 2.0: register an application at https://www.are.na/developers/oauth/applications and enter its client ID and secret on the connect page. Set the application's redirect URI to the Executor callback URL shown there. The authorize endpoint is on `www.are.na`, the token endpoint on `api.are.na/v3/oauth/token`; the app requests the `write` scope (access tokens do not expire).

## Known gaps

- Are.na prohibits scraping and bulk harvesting; the API is rate limited (120 requests/minute on the free tier).
- The `/v3/oauth/token` and `/v3/uploads/presign` operations come from the spec as-is; file uploads need a separate PUT to the presigned URL that these tools do not perform.
