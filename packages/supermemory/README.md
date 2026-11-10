# Supermemory

Memory and context API for AI agents: add and manage documents and memories, search, user profiles, container tags (spaces), settings and third-party connections (Google Drive, Notion, OneDrive and others).

**Interface:** OpenAPI, from Supermemory's official document at <https://api.supermemory.ai/v3/openapi>, served from `https://api.supermemory.ai`. Every mutation requires approval.

**Auth:** API key (`apiKey`), sent as a bearer token. Create one in the Supermemory console at <https://console.supermemory.ai> under API keys. No OAuth app flow is offered for the HTTP API (the remote MCP server at `https://mcp.supermemory.ai/mcp` uses OAuth but is not mounted here).

**Gaps:** the `/v3/openapi` document is the one Supermemory publishes; it may lag newer endpoints. The remote MCP server is not included. The icon is the mark from supermemory.ai's own `favicon.svg`.
