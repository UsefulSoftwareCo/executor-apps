# Kickbox

Email verification with Kickbox: verify a single address (deliverability result, reason, Sendex score, role/free/disposable flags, typo suggestion), start and monitor batch list verification jobs, and run the free disposable-domain check.

**Interface:** hand-written tools over the REST API documented at https://docs.kickbox.com/docs/using-the-api. Kickbox publishes no OpenAPI document for the verification API (only the disposable endpoint's definition appears in its docs) and no MCP server. Tools: `verify`, `batch.start`, `batch.status`, `disposable`.

**Auth:** API key. Create one in the Kickbox dashboard under API, then Manage Keys (https://app.kickbox.com), choosing the endpoint permissions. Keys starting `live_` spend credits; `test_` sandbox keys return mock results. Kickbox offers no OAuth. The account has a `region` field: `us` (api.kickbox.com) or `eu` for "EU Only" accounts (api.eu.kickbox.com). The key is sent as a Bearer token.

**Gaps:** the health check makes no network call because every verification spends a credit and there is no free account endpoint; a wrong key fails with 401 on the first tool call. Batch results are downloaded from the `download_url` that `batch.status` returns, not through a tool. `batch.start` sends the list as a text body, so very large lists are limited by the tool input size.
