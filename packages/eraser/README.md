# Eraser

Generate, create, read, search, update and organize technical diagrams, files, folders and presets in an Eraser workspace.

**Interface:** Eraser's official remote MCP server, `https://app.eraser.io/api/mcp` (docs: https://docs.eraser.io/mcp). Tools are discovered from the server at runtime. Tools without a read-only hint require approval.

**Auth:**
- Team API token: create one in Eraser under Settings > API tokens (https://app.eraser.io/dashboard/all?settings=api-tokens). It must be a team token; organization tokens are not supported. Sent as `Authorization: Bearer`. Usage is attributed to the team.
- OAuth: the server publishes OAuth metadata with dynamic client registration, so the connect page registers a client automatically. Redirect URI: use the one Executor shows on the connect page. Scope: `*`.

**Known gaps:** Only the MCP tool surface is exposed; Eraser's separate REST API (files, folders, diagrams, render, export, teams, usage) is not mounted. The MCP server was chosen because it is the vendor's agent-facing surface with OAuth, and no OpenAPI document for the REST API was found at docs.eraser.io (the guessed openapi.json path returns 404).
