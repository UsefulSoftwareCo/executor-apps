# Basecamp

Projects, to-do lists, messages, schedules, documents and files, Campfire chats, card tables, check-ins, people, webhooks and the rest of the Basecamp 3 (current Basecamp) REST API: 279 tools, 145 of them mutations (each asks for approval).

## Interface

OpenAPI, from the official Basecamp SDK repository (`basecamp/basecamp-sdk`, maintained by 37signals): https://raw.githubusercontent.com/basecamp/basecamp-sdk/490e10dcea4a933689ccaafa9214c03365fff969/openapi.json, pinned to commit `490e10dcea4a933689ccaafa9214c03365fff969` (release tag `v0.24.0`, MIT licensed, document `info.version` 2026-09-15) so the tool set does not change when the SDK's main branch moves. To update, pick a newer tag and change the SHA in `openapi.ts`. The document declares no servers or security schemes, so `openapi.ts` sets the origin (`https://3.basecampapi.com`) and bearer auth. Every path begins with the account ID, so each tool takes `accountId` (the number in your Basecamp URL, `3.basecamp.com/<accountId>/`). Requests carry an identifying `User-Agent`, which Basecamp requires.

## Auth

OAuth 2 only. Basecamp has no personal API keys, and its Basic auth is not available for Basecamp 3.

1. Register an app at https://launchpad.37signals.com/integrations.
2. Set its redirect URI to the one the Executor connect page shows.
3. Enter the app's client ID and secret on the connect page, then sign in.

Basecamp has no OAuth scopes: a token has the signed-in user's access. The health check reads `https://launchpad.37signals.com/authorization.json`, which also lists the accounts the user belongs to and their IDs.

## Verification notes

- Token renewal: access tokens last two weeks and Basecamp refreshes with POST `/authorization/token` using `grant_type=refresh_token`, `refresh_token`, `client_id` and `client_secret`. Executor's SDK (`packages/sdk/src/implementation/oauth-protocol.ts`) renews through oauth4webapi's refresh-token grant, which sends `grant_type=refresh_token` plus the refresh token, and with `client_secret_post` adds the client ID and secret to the body. The default token request encoding is a form (`tokenRequestFormat` is not set). Basecamp's docs do not say whether the token POST takes a form or query string, so form is an assumption. Confirmed from source only; no live connect or refresh was run. The legacy `type=web_server` / `type=refresh` parameters are not sent.
- Uploads: three operations have non-JSON request bodies: `PUT /{accountId}/account/logo.json` (multipart/form-data, `logo` file field), `POST /{accountId}/attachments.json` and `POST /{accountId}/chats/{campfireId}/uploads.json` (application/octet-stream). Executor's OpenAPI tools take binary bodies and multipart binary fields as base64 strings and leave wire serialization to the framework (per its app-authoring docs). They compile as tools, but no upload was sent, so treat them as untested; large files are also limited by tool argument size.

## Known gaps

Basecamp 2 and Basecamp Classic use different APIs and are not covered.
