# Klaviyo

Profiles, lists, segments, campaigns, flows, events, metrics, catalogs, templates,
forms, coupons, tags, webhooks and the rest of the Klaviyo REST API (345 tools, 141 of
them mutations that ask for approval).

Interface: OpenAPI, Klaviyo's official stable description at
https://raw.githubusercontent.com/klaviyo/openapi/main/openapi/stable.json (revision
2026-07-15), served from `https://a.klaviyo.com`. Every operation sends the required
`revision` header, which the description defaults to that revision.

## Auth

- **Private API key**: create one in Klaviyo under Settings > Account > API keys
  (https://developers.klaviyo.com/en/docs/authenticate_#private-key-authentication).
  Sent as `Authorization: Klaviyo-API-Key <key>`. Scope the key to the access you want.
- **OAuth 2.0**: create an OAuth app in the Klaviyo developer portal
  (https://developers.klaviyo.com/en/docs/set_up_oauth), register Executor's redirect URI
  as the app's redirect URL, then enter its client ID and secret on the connect page.
  Tokens are sent as bearer tokens. The requested scopes are all 46 declared by the vendor spec (x-klaviyo-scopes), covering the generated tools without
  admin-only scopes; Klaviyo only grants the scopes the OAuth app is configured with.

## Icon

Klaviyo's flag mark, redrawn as SVG from the official 512px site icon
(https://www.klaviyo.com/icons/icon-512x512.png); Klaviyo publishes no public SVG and
Simple Icons has no Klaviyo entry.

## Known gaps

Client-side endpoints that authenticate with a public company ID (`/client/*`) are
included but are meant for browsers; they take no private key. Beta endpoints
(`openapi/beta.json`) are not included.
