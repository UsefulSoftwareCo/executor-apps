# Dropbox Sign

Dropbox Sign (formerly HelloSign) eSignature: signature requests, templates, embedded signing and requesting, bulk send, accounts, teams, unclaimed drafts and API apps.

## Interface

OpenAPI, from Dropbox Sign's official document in `hellosign/hellosign-openapi`
(https://raw.githubusercontent.com/hellosign/hellosign-openapi/main/openapi.yaml), loaded live.
All operations live on `https://api.hellosign.com/v3`. Mutations require approval.

## Auth

- **API key**: create one in Dropbox Sign under Settings > API (https://app.hellosign.com/home/myAccount#api).
  It is sent as the HTTP Basic username with an empty password.
- **OAuth 2**: create an API app at https://app.hellosign.com/home/myAccount#api, then enter its client ID and
  secret on the connect page. Add Executor's redirect URI shown on the connect page to the app's OAuth redirect
  URL. Create the API app with the "Charge users" (user pays)
  billing model and enable all five scopes requested: `account_access`, `signature_request_access`,
  `template_access`, `team_access`, `api_app_access`. The "Charge me" scopes (`basic_account_info`,
  `request_signature`) are limited-access and not requested; use an API key for that model. The token request is
  sent as JSON per the official OpenAPI; confirm with a live exchange.

## Known gaps

- Two operations are skipped by the generator, leaving 72 tools: `/oauth/token` (served from app.hellosign.com, so
  `multiple_hosts`) and `/oauth/token?refresh` (`operation_path`). The host performs the OAuth token exchange, so
  skipping them is correct.
- OAuth refresh: Dropbox Sign refreshes at `POST https://app.hellosign.com/oauth/token?refresh`, but the apps
  `oauth2` declaration only has `tokenUrl` (and `revocationUrl`), so refresh would hit `/oauth/token` and OAuth
  accounts may stop working after the roughly one-hour access token lifetime until reconnected. Needs a refresh
  URL option in the framework; use the API key for durable access.
- The OAuth `state` is required by the vendor's token request; this relies on the host echoing it.
- The spec URL tracks the `main` branch and is not pinned.
- Calls made with an API key on a non-paid plan are limited to test mode by Dropbox Sign.
