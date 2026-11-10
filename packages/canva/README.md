# Canva

Designs, assets, folders, exports, comments, brand templates, autofill, resizing and user profile through the Canva Connect REST API (60 tools, no skipped operations), plus design generation and editing through Canva's official remote MCP server. One app, two mounts: tools under `api` (Connect REST) and `mcp` (MCP server), each with its own account.

Interface: Canva's official OpenAPI document, https://www.canva.dev/sources/connect/api/latest/api.yml, served from `https://api.canva.com/rest`. Mutations require approval. OAuth/OIDC plumbing operations in the document (token exchange, introspect, revoke, JWKS, signing keys, userinfo) are removed with patches because they are not Canva resources.

## Auth

OAuth 2.0 only (authorization code with PKCE); Canva Connect has no personal API keys.

- Create an integration at https://www.canva.com/developers/integrations/connect-api and copy its client ID and secret.
- Add Executor's redirect URI to the integration's authentication settings; Canva requires an exact match.
- Scopes requested: design content/meta, folder, asset, comment, brand template meta/content, and profile. Brand template and autofill endpoints require a Canva Enterprise organization; the token endpoint uses HTTP Basic client authentication.

## MCP (`mcp`)

Canva's official remote MCP server at https://mcp.canva.com/mcp (the live tool list comes from the server; third-party counts range from 22 to about 40). It is the only route to design generation, editing transactions and import from URL, which the REST API lacks. Tools that are not marked read-only require approval.

Auth is a separate "Canva MCP" account: OAuth 2.0 with PKCE, discovered from the server's RFC 9728 / RFC 8414 metadata, requesting the 16 scopes in `scopes_supported` (Canva tools report "Missing scopes" if one is not granted). MCP tokens only work against mcp.canva.com, so the Connect integration's client cannot be reused. Client registration is owned by the Executor host. Canva offers dynamic client registration and Client ID Metadata Documents (DCR is deprecated in favor of CIMD); this has not been confirmed with a real account, and Canva may restrict which MCP clients can register.

## Gaps

SCIM provisioning (`https://www.canva.com/_scim/v2`, team bearer token) and the Admin API are separate surfaces and not included. The `collaboration:event` webhook scope is not requested.
