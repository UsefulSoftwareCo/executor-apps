# Revolt (Stoat)

Revolt (Stoat), formerly Revolt, is an open-source chat platform. This package covers its REST API: users, direct messages, servers, channels, messages, members, roles, emoji, invites, bots, webhooks and relationships (118 tools; the 86 mutations require approval).

Interface: OpenAPI, loaded live from the official document at https://api.stoat.chat/openapi.json (https://api.revolt.chat/openapi.json serves the same document). Credentials only go to `api.stoat.chat`.

Auth:

- Bot token: create a bot in Revolt/Stoat under Settings > My Bots and copy its token. Sent as `x-bot-token`.
- User session token: the `x-session-token` returned by the login endpoint, for acting as a user account.

Known gaps: 13 operations are skipped because their schemas use unsupported `$ref` shapes. The MFA ticket endpoints are not wired; operations needing an MFA ticket will fail. File uploads go to the separate autumn/CDN service, which is not part of this OpenAPI document. Real-time events (websocket) are not available. Self-hosted instances are not supported.

Icon: the Stoat mark from the vendor's own https://stoat.chat/favicon-stoat.svg (the product's current brand).
