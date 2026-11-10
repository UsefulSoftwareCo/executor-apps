# Google Ads

Google Ads: GAQL reporting (`customers.googleAds.search` and `searchStream`), mutate tools for
campaigns, ad groups, ads, budgets, assets, bidding strategies, labels, user lists and
conversion actions, conversion and offline data uploads, keyword ideas and forecasts, reach
planning, audience insights, recommendations, batch jobs, experiments, product and account
links, invoices and account creation. 175 tools; the 125 mutations require approval, and
the 50 read-only ones (including the POST methods that only search, suggest or forecast) do not.

## Interface

OpenAPI, vendored as `openapi.json`. Google publishes the Google Ads API only as a Discovery
document, so `discovery-to-openapi.mjs` converts Google's own v25 document into OpenAPI 3.
The conversion is ours, not Google's, and the output is checked in so upstream changes show up
in review. Pinned at revision 20261008:
`https://googleads.googleapis.com/$discovery/rest?version=v25`. To refresh, download the
document (Google retires old API versions, so move to the newest `vN`) and run
`node packages/google-ads/discovery-to-openapi.mjs <doc> > packages/google-ads/openapi.json`,
then update the version in `index.ts` health. Paths use Google's `flatPath` form, so pass the
bare customer id as `customersId` (digits, no dashes). Every tool also takes an optional
`login-customer-id` header (exactly 10 digits) for calls made through a manager account. The
`developer-token` header is not emitted: Google sunset developer tokens on 2026-09-09 and now
ignores the header. Google
documents only a local open-source MCP server (github.com/googleads/google-ads-mcp), not a
hosted one, so OpenAPI is used.

## Auth

One account, Google Ads (OAuth 2.0). Choose Executor for Google on Executor Cloud when offered.
For a custom client, create an OAuth client of type "Web application" in
Google Cloud Console (APIs & Services > Credentials), enable the Google Ads API for the
project, and configure the consent screen (add test users while unverified). Add Executor's
OAuth redirect URI shown on the connect page to the client's authorized redirect URIs. The app
requests `https://www.googleapis.com/auth/adwords` (a sensitive scope, so production use
needs Google OAuth verification) with `access_type=offline` and `prompt=consent` so a
refresh token is issued. Discovery is from `https://accounts.google.com`. The signed-in
Google user must have access to the Google Ads account.

No developer token is needed. Google sunset developer tokens on September 9, 2026; the header
is optional and ignored, and a manager account is no longer required. API access level comes
from the Google Cloud project that owns the OAuth client (Test, Explorer, Basic or Standard
levels), per
https://developers.google.com/google-ads/api/docs/api-policy/developer-token. Users acting on
client accounts through a manager account may pass its 10-digit id as the optional
`login-customer-id` header on a call.

Not verified with a real account.

## Known gaps

- A Test-level Cloud project calling a production account gets
  `CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION` in API v25; raise the project's access level.
- `login-customer-id` is a per-call header, not an account setting.
- `searchStream` is exposed as a normal call that returns the whole response.
- Only the stable v25 surface is covered; older versions are not.

Executor Cloud can offer its shared **Executor for Google** OAuth client when the operator has configured it and enabled these scopes. Custom OAuth clients remain available; use the callback URL shown on the connect page. Self-hosted operators configure their own client. Google project API enablement, quotas, billing and account permissions still apply.
