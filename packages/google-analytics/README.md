# Google Analytics

Google Analytics 4: reports (standard, pivot, realtime, batch), report compatibility checks,
metadata, audience exports, and property administration (accounts, properties, data streams,
key events, custom dimensions and metrics, Firebase and Google Ads links, conversion events,
data retention, access reports). 66 tools:
11 from the Data API under `data` and 55 from the Admin API under `admin`. Mutations (32,
all Admin API plus audience export creation) require approval; report methods are POSTs that
only read and are marked as queries.

## Interface

OpenAPI, vendored as `data-openapi.json` and `admin-openapi.json`. Google publishes these
APIs only as Discovery documents, so `discovery-to-openapi.mjs` converts Google's own
documents into OpenAPI 3. The conversion is ours, not Google's, and the output is checked in
so upstream changes show up in review. Pinned at revision 20261007:

- Data API v1beta: `https://analyticsdata.googleapis.com/$discovery/rest?version=v1beta`
- Admin API v1beta: `https://analyticsadmin.googleapis.com/$discovery/rest?version=v1beta`

To refresh, download each document and run
`node packages/google-analytics/discovery-to-openapi.mjs <doc> > packages/google-analytics/<data|admin>-openapi.json`.
Paths use Google's `flatPath` form (`properties/{propertiesId}:runReport`), so pass the bare
numeric property id as `propertiesId`, not `properties/123`. Two documents are used because
the APIs live on different hosts, and the stable v1beta surfaces are used rather than the
alpha ones. Google documents only a local read-only MCP server
(github.com/googleanalytics/google-analytics-mcp); an undocumented hosted endpoint exists at
analyticsdata.googleapis.com/mcp/v1 with a few read-only tools and is not used because it is
undocumented. The OpenAPI interface remains the better choice.

## Auth

OAuth 2.0 only; Google has no user API keys for private Analytics data. Create an OAuth client
of type "Web application" in Google Cloud Console (APIs & Services > Credentials), enable the
Google Analytics Data API and Google Analytics Admin API for the project, and configure the
consent screen (add test users while it is External and unverified). Add Executor's OAuth
redirect URI shown on the connect page to the client's authorized redirect URIs. The app
requests `analytics.readonly` and `analytics.edit` (plus `openid email profile` for the
health check) with `access_type=offline` and `prompt=consent` so a refresh token is issued.
`analytics.edit` is a sensitive scope, so production use needs Google OAuth verification;
until then the test-user limit applies. Discovery is from `https://accounts.google.com`. The authenticated user must have access to
the GA4 property being queried. Not verified with a real account.

## Known gaps

- Access bindings (user management), audiences and BigQuery links exist only in v1alpha
  and are omitted, as are other alpha-only features (funnel reports, event create rules,
  `analytics.chatbot.read`). v1alpha adds about 111 admin methods; alpha was left out
  deliberately because it is unstable and may change without notice.
- Universal Analytics (Management API v3 / Reporting API v4) is discontinued and not covered.
