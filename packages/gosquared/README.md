# GoSquared

Covers GoSquared's web analytics and customer messaging APIs: Now (realtime visitors, pages, sources), Trends (historical analytics), People (profiles, devices, smart groups, event and property types), Chat, Account (sites, shared users, blocked traffic, tagged visitors, webhooks) and the Tracking API (events, pageviews, properties, transactions). 93 tools.

**Interface:** hand-written tools over the REST API at `https://api.gosquared.com` (docs: https://www.gosquared.com/docs/api/). GoSquared publishes no OpenAPI document and no official MCP server or GraphQL API, so each documented endpoint is listed in `operations.ts` from the docs. Each tool takes path IDs, a `query` object, and for POST a `body` object. Every POST and DELETE requires approval.

**Auth:** API key only (GoSquared has no OAuth for the API). Create a key under API Access in account settings (https://www.gosquared.com/settings/api); find the site token under Settings > Current Project > General. Both are sent as `api_key` and `site_token` query parameters. Keys can be scoped, so endpoints outside the key's scopes return an authorisation error. The health check calls `auth/v1/tokeninfo`.

**Gaps:** `DELETE` endpoints that the docs do not list (for example for blocked IPs or shared users) are not exposed; POST body schemas are free-form JSON rather than typed. The People and Chat APIs are marked beta by GoSquared.
