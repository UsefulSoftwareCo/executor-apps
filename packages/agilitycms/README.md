# Agility CMS

Manage an Agility CMS instance from an agent: content items, pages, content models, containers, assets and related instance data, using the tools Agility's own MCP server exposes.

- **Interface:** Agility's official remote MCP server, `https://mcp.agilitycms.com/api/mcp` (listed in Agility's developer surfaces; tools are whatever the server advertises, discovered at runtime). Source repository: [agility/mcp-server](https://github.com/agility/mcp-server) (documentation under Apache 2.0; the hosted service is under Agility's terms). Docs: [agilitycms.com/docs/ai](https://agilitycms.com/docs/ai). The repository README lists 32 tools, not verified against a live account.
- **Auth:** OAuth 2.0 only. The server publishes protected-resource and authorization-server metadata with dynamic client registration (`https://mcp.agilitycms.com/api/auth/register`), so no OAuth app needs to be created by hand. Connect with an Agility account that has access to the target instance. Redirect URI: use the one shown on the Executor connect page; it is registered automatically through dynamic client registration.
- **Approvals:** every tool that is not marked `readOnlyHint` asks for approval.

## Known gaps

- GraphQL Fetch API (`https://api.aglty.io/{guid}/{apitype}`) is not exposed: it is read-only content delivery with a per-instance Fetch key. The Management REST API is not exposed because no spec is published; the MCP server is the official path that includes writes.
- Agility's REST APIs (Content Fetch with an API key, Content Management API) publish no OpenAPI document, and the Fetch API key is per instance and per environment (`fetch` or `preview`). They are not exposed here; an API-key connection is not offered because the MCP server only accepts OAuth.
- Tool list was not enumerated before connecting, because the server requires OAuth and no real account was connected.
