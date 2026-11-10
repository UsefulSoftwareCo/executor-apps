# Cloudbeds

Hotel property management in Cloudbeds: reservations, guests, rooms and room types, rates, availability, payments, housekeeping, house accounts, groups and allotment blocks, custom fields and webhooks. 500 tools (268 mutations, each requiring approval) across ten API documents, each mounted under its own key.

## Interface

OpenAPI, from Cloudbeds' own repository https://github.com/cloudbeds/openapi-specs (src/), all served from `https://api.cloudbeds.com`:

| Key | Document | Tools |
| --- | --- | --- |
| `pms` | pms-v1.3-openapi.yaml (base `/api/v1.3`; blank OAuth URLs declared in `openapi.ts`) | 115 |
| `pmsV2` | pms-v2.0-openapi.yaml | 51 (20 operations skipped: `schema_reference`) |
| `insights` | cloudbeds-insights-v1.1-openapi.json | 130 |
| `accounting` | accounting-v1.0-openapi.json | 55 |
| `guestProfiles` | guest-profiles-v1.0-openapi.yaml (relative server `/guest-profiles/v1`, set as `baseUrl`) | 16 |
| `groupProfile` | group-profile-v1.0-openapi.yaml | 29 |
| `payByLink` | pay-by-link-v2.0-openapi.json (server `/payments/v2`) | 2 |
| `paymentElement` | payment-element-api-key-v1.0-openapi.json (server `/payments/sdk-api`) | 3 |
| `fiscalDocument` | fiscal-document-v1.0-openapi.yaml | 82 |
| `attributeTagging` | attribute-tagging-v1-openapi.yaml | 17 |

Every document except `pms` declares HTTP bearer auth; the API key or OAuth access token is sent as `Authorization: Bearer`. The newer documents have no OAuth URLs of their own that differ for an app that already has v1.3 credentials, so the same token is used. This has not been exercised against a live account.

Deliberately not mounted:

- `payments-vault-v1.0-openapi.json`: server is `https://api.payments.cloudbeds.com`, a different host, and it tokenizes raw card numbers, so it is outside the single `api.cloudbeds.com` credential destination.
- `ota-build-to-us-v5.3-openapi.json`: describes endpoints a channel partner implements for Cloudbeds to call, not a Cloudbeds API.
- `pms-v1.2-openapi.yaml`: superseded by v1.3.

Group profile and attribute tagging also list regional hosts (`api.us1.cloudbeds.com`, `api.us2.cloudbeds.com`). Only the general `api.cloudbeds.com` host is mounted; attribute tagging's document says the general host serves us1 properties only, so properties on us2 may be misdirected.

## Auth

- **API key** (recommended by Cloudbeds): sign in, open Account > Apps & Marketplace > API Credentials, create credentials (`https://localhost` works as the redirect URI), then create an API key on its row and pick the scopes you need. The key is shown once. Sent as `x-api-key`.
- **OAuth 2.0**: create credentials on the same page to get a client ID and secret. The redirect URI must be HTTPS and match the one Executor shows on the connect page. Authorize `https://api.cloudbeds.com/api/v1.3/oauth`, token `https://api.cloudbeds.com/api/v1.3/access_token`, credentials in the request body. Cloudbeds' OAuth guide (https://developers.cloudbeds.com/docs/alternative-oauth-20-authentication-method) shows the authorize request with only `client_id`, `redirect_uri` and `state`; scopes are selected on the credentials' App Details page, so none are requested here and `scopes` is empty in both `oauth2()` and the security scheme. Pick the scopes your tools need (read/write pairs such as `read:reservation`, `write:reservation`) when creating the credentials. Access tokens last 8 hours and are refreshed.

## Known gaps

- The non-v1.3 documents are untested with an OAuth token from the v1.3 flow. Cloudbeds' own API key guide documents the Bearer form for keys.
- Guest photo and document upload endpoints are multipart and limited to what the generated tools support.
