# Simple Analytics

Privacy-friendly web analytics. Tools: `stats` (Stats API, `/{hostname}.json?version=6`), `websites.list` and `websites.add` (Admin API), and `exportDatapoints` (Export API, CSV of raw pageviews and events).

Interface: hand-written tools over the documented HTTP APIs, https://docs.simpleanalytics.com/api/stats, https://docs.simpleanalytics.com/api/admin and https://docs.simpleanalytics.com/api/export-data-points. Simple Analytics publishes no OpenAPI document or MCP server, so `stats` takes free-form `params` for its many filters.

Auth: API key only (Simple Analytics has no OAuth). Create the key at https://simpleanalytics.com/account and copy the user ID (`sa_user_id_...`) from the same page. Both are sent as the `Api-Key` and `User-Id` headers.

Known gaps: `websites.add` needs a Business or Enterprise plan. The Admin API has no update or delete endpoints. Event ingestion (`queue.simpleanalyticscdn.com`) is not exposed. The export returns the whole CSV in one result, so keep ranges short.
