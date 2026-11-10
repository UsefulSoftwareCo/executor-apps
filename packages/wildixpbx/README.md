# Wildix PBX

Covers the Wildix developer APIs for a PBX tenant: PBX management and call control (WMS), call history and analytics (WDA history, insights and stream), x-bees conversations, users and chatbots, Kite widgets, the x-bees assistant, voicebots, integrations, knowledge bases and Company API key introspection.

## Interface

OpenAPI. Wildix generates official OpenAPI 3 documents from its Smithy models and publishes them from its developer portal ([API reference](https://docs.wildix.com/api-reference)) at `https://docs.wildix.com/codegen/api/<name>.openapi.json`. One document is mounted per API under its own key: `pbx` (`wms-api-client`, on the account's own host `https://<domain>.wildixin.com`), `apiKeys`, `analyticsHistory`, `analyticsInsights`, `analyticsStream`, `conversations`, `users`, `kite`, `assistant`, `voicebots`, `integrations` and `knowledgeBase`. The other APIs run on `wda.wildix.com`, `api.x-bees.com`, `wim.wildix.com` and `kb.wim.wildix.com`.

## Auth

A Company API key (PBX 7.09 and later), sent as a bearer token. Create it in Wildix Management (WMS) or through the API keys page of the developer portal, with the scopes you need, and enter it together with the PBX domain (`my-pbx` or `my-pbx.wildixin.com`). Health is checked with a read-only `GET /api/v1/network/pbxes/` on the PBX domain (the key needs a scope that allows reading PBXes). The key is sent only to `*.wildixin.com`, `*.wildix.com` and `api.x-bees.com`.

## Known gaps

- OAuth is not offered. Wildix PBX OAuth 2.0 applications live on each tenant (`https://<domain>.wildixin.com/authorization/oauth2`), and an Executor OAuth method cannot take the tenant domain, so there is no static authorization URL to declare.
- Operations that Wildix restricts to s2s, PBX, bot or x-bees user tokens (not the Company API key) are left out: 3 in `conversations`, 1 in `users`, 1 in `voicebots` and 5 in `apiKeys`. The PBX info, notifications, STT, TTS, classound, CDS and WMS permissions APIs are not mounted.
- The Kite, analytics and conversations APIs are cloud services shared across tenants; the key's company decides which data is visible.
