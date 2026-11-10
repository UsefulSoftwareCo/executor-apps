# Cutt.ly

Shorten URLs, edit and delete short links (alias, destination, tags, expiry, mobile and deferred deep links, A/B tests, passwords) and read click analytics on Cutt.ly, through both the regular API and the Team API.

**Interface:** hand-written tools over Cutt.ly's documented HTTP APIs. Cutt.ly publishes no OpenAPI document, GraphQL API or remote MCP server. The `api` group wraps https://cutt.ly/api/api.php (docs: https://cutt.ly/api-documentation/regular-api): `shorten`, `stats`, `edit`, `delete`, `setPassword`. The `team` group wraps https://cutt.ly/team/API/index.php (docs: https://cutt.ly/api-documentation/team-api) with the same five operations. Every mutation requires approval.

**Auth:** API key only (Cutt.ly has no OAuth), sent as the `key` query parameter. Add one account per API:
- Regular API key: Cutt.ly dashboard, Edit Account page (https://cutt.ly/edit).
- Team API key: the Team edit page; requires a Team plan or higher.

**Icon:** the Cutt.ly mark from the vendor's own site (`https://cutt.ly/img/c_logo.svg`).

**Known gaps:** the API has no endpoints for listing links, domains or tags. Rate limits are tight on the free plan (3 calls per minute), and editing, date-filtered stats and several options need paid plans. The regular health check calls `stats` on a nonexistent link, which counts against the rate limit.
