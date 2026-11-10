# 8x8

8x8 Admin Provisioning (users, sites, ring groups, phone numbers, addresses and the asynchronous operations they return), Audit records, outbound campaigns, Work Chat and Customer 360, plus Contact Center real-time and historical analytics (US, EU, AU and CA) and the Contact Center Chat API v2.

Interface: OpenAPI, using the official documents 8x8 publishes in [8x8Cloud/public-developer-docs](https://github.com/8x8Cloud/public-developer-docs/tree/master/docs_oas). Each document is a mount in one router. 129 tools across 19 mounts (counts from `node packages/8x8/counts.ts`):

| Auth | Mount (tools) |
| --- | --- |
| API key | `users` (5), `sites` (5), `ringGroups` (6), `phoneNumbers` (2), `addresses` (4), `operations` (1), `audit` (1), `campaigns` (2), `workChat` (2), `customer360` (2) |
| OAuth | `realtime` (10), `realtimeEu` (10), `realtimeAu` (10), `realtimeCa` (10), `historical` (10), `historicalEu` (10), `historicalAu` (10), `historicalCa` (10), `chat` (19; the `/oauth/v2/token` operation is skipped, Basic auth) |

Auth, both created in the 8x8 Admin Console under API Keys (`admin.8x8.com/api-access`; see [Create an API key](https://developer.8x8.com/connect/docs/api-keys-and-authentication) for Connect and the [8x8 developer portal](https://developer.8x8.com) for the others):

- API key: sent as `x-api-key`. Assign the matching API products to the key. For `campaigns`, 8x8 also expects an `X-8x8-Tenant` header (Tenant Name from Configuration Manager), passed as a tool parameter; the customer site is a path parameter.
- OAuth client credentials: the key and secret of an API app, exchanged at `https://api.8x8.com/oauth/v2/token` with Basic client authentication. There is no browser redirect, so no redirect URI, and no scopes: access follows the API products assigned to the key.

An account uses one method, so connect both an API key account and an OAuth account to use all tools.

Regions: the analytics specs publish `/eu`, `/au` and `/ca` servers. An OAuth account has no region field, so each region is its own mount; use the unsuffixed `realtime`/`historical` for the default (US) origin and the `Eu`, `Au` or `Ca` mount for tenants there. `hosts` is only `api.8x8.com`, which every mounted spec uses. The Chat API v2 takes `region` and tenant as path parameters. Customer 360 is mounted for the `us` server only; its `uk`, `ca` and `ap` servers are not selectable.

Official specs not mounted:

- `contact_center_call_api.json`, `contact_center_agent_status_api.json`, `8x8_contact_center_dynamic_campaigns.json`: servers are per-tenant `vcc-*.8x8.com` / `odcc2.bell.ca` hosts (dozens of them), not `api.8x8.com`, so they need a different `hosts` list and a tenant host that is not known up front.
- `contact-center-chat-gateway-v1.oas.yml`: same host and API key, but the Executor OpenAPI compiler rejects the YAML at its URL (`invalid_definition`). The Chat API v2 mount covers the same product; `contactcenter/8x8_contact_center_chat_api.json` is an older copy of it.
- `work_analytics*.json`: every operation requires a bearer token (`bearerAuth`) while the spec only documents an `8x8-apikey` header; how that token is issued is not documented, so not mounted.
- `quality_management_and_speech_analytics_api.json`, `cloud_storage_service_public_api.json`: bearer tokens with `{region}/{apiversion}` server variables and an unclear credential; not mounted.
- Converse (`conversation`, `messaging`, `reporting`, `setup`, `bot_response`): hosted on `*.moobidesk.com` with their own credentials.
- Connect (`sms`, `voice`, `verification`, `contacts`, `number_lookup`, `business_messaging`, `automation`, and others): hosted on `sms.8x8.com`, `voice.8x8.com`, `chatapps.8x8.com`, etc. with Connect subaccount API keys, a separate credential and host set. `video_interaction_api.json` has no security scheme and a `video-agent.8x8.com` host.
