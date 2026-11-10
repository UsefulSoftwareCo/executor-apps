# Postalytics

Direct mail automation with Postalytics: campaigns and their delivery stats, templates, contact lists and contacts, flows, triggered drip sends, suppression lists, webhooks, login links and agency sub-accounts. 45 tools.

## Interface

Custom, hand-written tools over the REST API at `https://api.postalytics.com/api/v1`. Postalytics publishes no OpenAPI document; its reference at https://docs.postalytics.com is rendered from one that is not public, so operations and paths were transcribed from that reference. Mutation request bodies are passed as a JSON `body` using the API's snake_case field names (listed in each tool description).

## Auth

API key (`apiKey`): the key is sent as the HTTP Basic username with an empty password. Find it in Postalytics under Account > Connect > API Key. An agency can also mint per-client keys with `account.create`. No OAuth app is documented.

Unresolved source conflict: the vendor's multi-tenant blog post (https://www.postalytics.com/blog/multi-tenant-direct-mail-api/) shows `POST /api/v1/send` and `POST /api/v1/flow` with an `X-API-Key: <key>` header and no Basic auth. The vendor support article on incoming webhook authentication (https://support.postalytics.com/support/solutions/articles/70000599897-incoming-webhook-authentication-and-http-request-info) uses Basic auth with the key as username and an empty password, but only for the per-campaign incoming webhook URL. Pipedream's open-source component (https://raw.githubusercontent.com/PipedreamHQ/pipedream/master/components/postalytics/postalytics.app.mjs) uses Basic auth against `https://api.postalytics.com/api/v1`. The vendor's REST reference pages do not state the scheme in fetchable content, and an unauthenticated request to `/api/v1/account/me` returns a bare 401 with no `WWW-Authenticate` header. This package sends Basic only (the one scheme with a working third-party implementation against `/api/v1`) and never both headers. If requests fail with 401 on a valid key, switch `authorization()` in `index.ts` to `X-API-Key`; confirm with Postalytics support.

## Known gaps

- Request body fields beyond the documented essentials are not validated; the API reports errors.
- Docs describe the key's Basic-auth placement for incoming webhooks and the official SDK uses Basic auth for the REST API; no vendor call was made with a real key to confirm it (see the Auth section for the X-API-Key conflict).
- Flow and campaign-status endpoints are taken from the docs sidebar, not an SDK; exact body shapes may differ.
- The icon is the envelope mark cropped from the vendor's logo (docs.postalytics.com/icon-light.svg).
