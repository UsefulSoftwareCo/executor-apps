# Egnyte

Search, browse and read files and folders, ask documents and Copilot questions, and work with links, comments, projects, workflows and knowledge bases in Egnyte, plus the write tools Egnyte has added (upload a text file, create a folder, set metadata, create a comment or link).

**Interface:** Egnyte's official remote MCP server, `https://mcp-server.egnyte.com/mcp`
(docs: https://developers.egnyte.com/api-docs/remote-mcp-server). Tools are discovered live; the set depends on the Egnyte plan (platform plans without the AI add-on get only a few). Tools without `readOnlyHint` require approval.

**Auth:** OAuth 2.0 only, via the server's published metadata with dynamic client registration; no client needs to be created by hand and no tenant subdomain is asked for. The authorization server is `https://mcp-oauth.egnyte.com/egnyte-connect` (declared as a credential host). It advertises no scopes, so none are requested; whether a refresh token is issued without a scope is unconfirmed, so users may need to reconnect when the access token expires. Unverified (vendor docs page was unreachable): an Egnyte admin may need to enable "Allow external LLM access" under Settings > Configuration > AI. Redirect URI: use the one Executor shows on the connect page (registered automatically).

**Known gaps:** Egnyte's REST Public API (`https://<domain>.egnyte.com/pubapi`) has no official OpenAPI document and its OAuth endpoints are per-tenant, so it is not used. Unverified against vendor docs: the MCP server has no delete, move, copy or rename tools, no user/group/permission administration.
