# Crisp

Customer messaging in Crisp: conversations and messages (send, assign, resolve, batch operations), contacts with custom data and events, operators, teams and inboxes, campaigns and templates, live visitors, helpdesk (knowledge base) articles, workspace settings and identity verification, plus the Marketplace plugin connect endpoints.

**Interface:** hand-written tools (170) over the official Crisp REST API v1 (`https://api.crisp.chat/v1`, reference at https://docs.crisp.chat/references/rest-api/v1/). No official OpenAPI document or remote MCP server was found in the REST reference, which links only a Postman collection (https://docs.crisp.chat/static/data/collections/rest-api-v1.postman); there is no integrations.sh record for Crisp. The endpoint list follows the official `crisp-im/node-crisp-api` client and was re-checked against that Postman collection; the reference page was last updated on September 13, 2026. Every tool takes optional `websiteId` (defaults to the workspace of a website token; required with a plugin token), path ids, `query` for URL parameters and, for writes, a JSON `body` as described in the reference. Lists use `page` (starting at 1). All writes require approval, as does `website.verifyKey` (it returns the identity verification secret).

**Auth:** two token types, both a keypair sent as HTTP Basic auth with the `X-Crisp-Tier` header (https://docs.crisp.chat/guides/rest-api/authentication/).
- Website token: in Crisp, Settings, Workspace Settings, Advanced configuration, Website token (identifier and key). Enter them with the Website ID (shown in the same settings area). Scopes are those of the workspace token.
- Plugin token: create a plugin in the Crisp Marketplace developer dashboard (https://marketplace.crisp.chat) and enter its token identifier and key. One token reaches every workspace that installed the plugin; some scopes need Crisp approval. Use `plugin.websites` to list those workspaces.

Crisp's REST API uses these token keypairs, not OAuth, for direct API access, so OAuth is not offered.

**Known gaps:** not wrapped are user-tier endpoints (account, billing, plan and plugin subscription management), media upload buckets and animations, browsing and call sessions, widget actions, tool calls, existence `HEAD` checks, and real-time (RTM/webhook) subscriptions. The website-token health check reads the workspace availability status and requires a 2xx response containing `data.status`; any 401, 403 or 404 fails it.
