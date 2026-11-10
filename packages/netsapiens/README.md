# NetSapiens

Covers the NetSapiens API v2 for a NetSapiens (SNAPsolution) VoIP platform: domains, resellers, users, phone numbers, call queues and agents, auto attendants, dial plans, devices and phones, voicemail, messaging (SMS/MMS/chat), call history, conferences, timeframes, API keys, event subscriptions and the rest of the API. Mutations require approval.

Interface: OpenAPI 3.1, NetSapiens' official API v2 document at https://docs.ns-api.com/openapi/netsapiens-api-v2.json (advertised in https://docs.ns-api.com/.well-known/api-catalog). Its server is templated as `https://{server}/ns-api/v2`, so each account's own platform host is used and credentials are only ever sent to that origin.

Auth: one method, API key. Create a key in the NetSapiens manager portal (or through the Create API Key endpoint with sufficient access); the key prefix shows its scope (`nss_` super user, `nsr_` reseller, `nsd_` office manager, `nsu_` user) and it can be made read-only. When connecting, enter the API host (for example `api.example.com`) and the key; it is sent as `Authorization: Bearer <key>` (docs: https://docs.ns-api.com/docs/api-keys).

Known gaps: the platform also supports OAuth2 password-grant access tokens and JWTs, but these need a user's own password and a per-platform client ID/secret rather than a user-created OAuth app, so they are not offered. The docs site's own MCP server only searches documentation and is not used. The icon is NetSapiens' official site app icon (300px PNG), since no SVG is published.
