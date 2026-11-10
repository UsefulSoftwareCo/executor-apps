# Seam

Control smart locks, access codes, access control systems (ACS), thermostats,
noise sensors and other connected devices in a Seam workspace: devices, connected
accounts, access codes, access grants, ACS users and credentials, events,
webhooks and more.

**Interface:** OpenAPI. Seam's official document at
https://connect.getseam.com/openapi.json (about 335 paths, all on
`connect.getseam.com`).

**Auth:** API key (`secrets`). Create a workspace API key in the Seam Console
(https://console.seam.co) under Developer > API keys, and paste it as the token;
it is sent as `Authorization: Bearer <key>`. Seam offers no user-created OAuth
apps for the API, so there is no OAuth method. The health check calls
`/workspaces/get`.

**Provenance:** the document is the vendor's own "Seam Connect" OpenAPI
(openapi 3.0.0, servers only `connect.getseam.com`, bearer `api_key` scheme).
Seam's docs say its SDKs are generated from the same spec but do not publish
this URL, so its stability is not documented. Seam also offers an official MCP
server for AI agents; the OpenAPI document is used because it exposes far more
operations.

**Icon:** Seam's official 512px app icon (PNG). No vendor SVG was found and Simple
Icons has no Seam entry.

**Known gaps:** Only the workspace API key scheme is wired. 59 operations that
require client session tokens, publishable keys, personal access tokens,
console sessions or bridge client sessions (used by Seam's frontend components)
are not exposed (skipped as `auth_method`). Three operations that take no
workspace API key are removed as well: the inbound webhook receiver
`POST /seam/webhooks/[provider]/[subscription_id]`, the connector redirect
`GET /seam/customer/v1/connectors/authorize` and
`POST /seam/bridge/v1/bridge_client_sessions/create`. Every mutation requires approval.
