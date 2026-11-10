# Matterport

Search and read Matterport 3D models (details, assets, floors, rooms, tags), and edit model metadata, through Matterport's official Model GraphQL API at `https://api.matterport.com/api/models/graph` (docs: https://matterport.github.io/showcase-sdk/api_home.html). Tools are generated from the live schema by introspection; every mutation requires approval. The icon is Matterport's official favicon mark (https://matterport.com), with its dark-scheme paths pinned to black so the script can recolor them.

## Auth

- **API token** (`apiKey`): in my.matterport.com go to Settings > Developer Tools > API Token Management and create a Token ID and Token Secret (shown once). Sent as HTTP Basic auth.
- **OAuth 2.0** (`oauth`): not self-serve. Matterport says OAuth "is currently offered by invitation only for our Commercial Partners" (Developer Tools Production License plus a Commercial Partnership agreement, then email MP-developer@costar.com to enable it). Only partners with an enabled OAuth app can use this method; everyone else should use the API token. Once enabled, register the app, enable the scopes `ViewPublic`, `ViewDetails`, `EditDetails` and `DownloadAssets`, and register Executor's redirect URI on the app. Authorize URL `https://authn.matterport.com/oauth/authorize`, token URL `https://api.matterport.com/api/oauth/token` (credentials in the form body). `PurchaseAssets` is deliberately not requested.

## Warnings

Matterport says its APIs only accept server-side requests. API tokens are admin-level, all-access keys for the whole account: anyone holding one can archive models and buy assets. Do not share them.

## Known gaps

The Account API (`/api/accounts/graph`, Enterprise only) and Import API (`/api/import/graph`, Enterprise beta) are not mounted. Not verified against a real account: the schema is only discoverable with credentials.

- OAuth quirks: Matterport requires a space-delimited `scope` in both the authorize request and the code-exchange POST (matching the authorized scopes). The package declares `scopes`, but it is not verified that the Executor host sends `scope` in the token exchange body; if exchange fails with a missing-scope error, that is the cause. Refresh tokens last 30 days and rotate: a token older than 24h returns a new `refresh_token` on refresh, which the host must persist.
- Auth facts rest on Matterport's vendor docs.
- The tool count is unknown: the schema is only introspectable with credentials, so the GraphQL tools are unverified.
