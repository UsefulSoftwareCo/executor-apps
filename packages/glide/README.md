# Glide

Build, manage and operate GlideOS projects, apps, app databases, workflows and project files through Glide's official hosted MCP server.

- Interface: remote MCP (Streamable HTTP) at https://mcp.glideapps.dev/mcp. Docs: https://www.glideapps.com/docs/os/mcp, the official docs are the authority (https://github.com/glideapps/mcp only holds client plugin and config manifests for Cursor, Gemini CLI and VS Code, not server code). Tools are discovered from the server at runtime.
- Auth: OAuth 2.1 with dynamic client registration, discovered from the server's metadata (scopes `mcp:tools`, `openid`, `email`). Sign in with your Glide account; there is no API key. No OAuth app needs to be created. The server supports dynamic client registration, so Executor's callback is registered automatically and no redirect URI needs configuring. Glide's docs say the MCP server requires a Pro or Enterprise plan.
- Approvals: every tool that is not marked read-only requires approval.
- Known gaps: Glide's docs say each connection belongs to one organization (https://www.glideapps.com/docs/os/mcp); a connection is bound to one Glide organization; the generic URL is used here. No API-key auth exists.
