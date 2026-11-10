# Mailsoftly

Email marketing with Mailsoftly: contacts, contact lists, tags, custom fields, segments, campaigns, email templates, automations, forms, SMS campaigns, suppressions and unsubscribes, account and team info.

## Interface

OpenAPI. Mailsoftly's official document, https://app.mailsoftly.com/developers/openapi.json, is compiled live into 151 tools (91 mutations, all gated by approval). Everything is served from `https://app.mailsoftly.com/api/v3/`.

## Auth

- **API key**: create one in Mailsoftly under Settings > API Keys. It is sent raw in the `Authorization` header, with no `Bearer` prefix. New keys are shown once and expire after a year.
- **OAuth 2.1**: Mailsoftly publishes discovery metadata and dynamic client registration (authorization code with PKCE, public clients, no client secret). The connect flow registers its own client; the redirect URI is the one Executor shows on the connect page. Scopes: contacts:read/write, campaigns:read/draft/send, suppressions:write, account:read. `account:write` (invite teammate, revoke invitation, change team member role) is not requested because it is admin-level.

## Known gaps

- The three team-management tools (`invite_team_member`, `revoke_invitation`, `update_team_member_role`) need the admin-level `account:write` scope, which OAuth does not request, so they return insufficient_scope over OAuth.
- Mailsoftly also hosts an official MCP server at https://app.mailsoftly.com/mcp (OAuth). It publishes 139 curated tools, a subset of the 151 REST operations, so OpenAPI is the richer interface and the MCP server is not mounted.
