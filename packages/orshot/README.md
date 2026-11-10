# Orshot

Generates images, PDFs and videos from templates designed in Orshot Studio, and covers the rest of the workspace API: brand assets (images, fonts, colors, audio, video), approval flows and comments, notifications, signed URLs, AI video and social accounts and publishing.

Interface: Orshot's official OpenAPI 3.1 document, https://orshot.com/openapi.json (API origin `https://api.orshot.com/v1`). Mutations require approval.

Auth:
- Workspace API key: create it in the Orshot dashboard (https://orshot.com/docs/quick-start/get-api-key). Sent as a bearer token.
- OAuth 2.0 (authorization code + PKCE, public client, no secret): endpoints come from `https://api.orshot.com/.well-known/oauth-authorization-server`. Orshot supports dynamic client registration at `https://api.orshot.com/v1/oauth/register`; register the Executor redirect URI shown on the connect page. Scopes requested: workspace:read, workspace:templates:read/write, render:generate, offline_access. The approvals scopes (read/write/decide/admin) are documented in https://orshot.com/auth.md but the live authorization server rejects them for the dynamically registered client (`invalid_scope: Client is not authorized for scope(s)`), so they are not requested.

Known gaps: all approval-flow operations (read, write, decide, admin) and anything else needing scopes outside the list above return 403 under OAuth; connect with a workspace API key to use them. The vendor's official remote MCP server (https://mcp.orshot.com/mcp, OAuth only) also exposes stock media search/use, dynamic URL management, embed config and library templates, which have no paths in the OpenAPI document and are not covered here.
