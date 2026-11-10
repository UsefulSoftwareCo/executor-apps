# Wati

Wati WhatsApp Business: workspaces, contacts, conversations and messages, templates, campaigns, segments, channels and webhooks.

**Interface (two mounts):**
- `mcp`: Wati's official remote MCP server (docs https://docs.wati.io/reference/mcp.md), about 58 tools; the session's `tools/list` is authoritative and some tools are gated by plan, role or rollout. Global `https://mcp.wati.io/mcp`, EU `https://eu-mcp.wati.io/mcp`. Every tool without `readOnlyHint` requires approval.
- `api`: 13 hand-written tools over the legacy v1/v2 REST API (https://docs.wati.io/), kept for access-token users. Every mutation requires approval. Wati's newer v3 API (`/api/ext/v3/...`, no tenant ID in the path, scoped tokens) is not wrapped; the MCP server covers that surface.

**Auth:**
- OAuth (MCP): add a "Wati MCP" account and pick Global or EU to match your workspace region. The servers publish RFC 8414 metadata and dynamic client registration, so no OAuth app needs creating. Scopes: the server advertises only `all`; access is limited by your workspace roles and plan.
- Access token (`api`): in Wati go to Connector > API > Create API Token (or the API Docs page for the legacy token), and copy the API endpoint (for example `https://live-mt-server.wati.io/12345`) and the token. Sent as `Authorization: Bearer <token>` (confirmed in https://docs.wati.io/reference/authentication.md). Credentials are only sent to `*.wati.io` and the two MCP hosts.

**Icon:** the speech-bubble mark cut from Wati's official logo at https://mcp.wati.io/logo.svg (no Simple Icons entry; no public brand kit found).

**Known gaps:** the `api` tools skip template CRUD, broadcasts, CSV template sends, chatbot and channel endpoints; `sendSessionFile` takes base64 content; `getMessages` is limited to 10 requests per 10 seconds; session messages work only within 24 hours of the contact's last message. The health check on `api` lists one contact.
