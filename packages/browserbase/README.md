# Browserbase

Browserbase runs headless browsers as a service. This package exposes the full public REST API (66 tools): browser sessions (create, list, update, debug, logs, recording, uploads, downloads), contexts, extensions, projects and usage, agents and agent runs, fetch, search, functions and builds, secrets, certificates and webhooks.

**Interface:** OpenAPI, from Browserbase's official document at https://docs.browserbase.com/reference/api/openapi.v1.yaml (API origin `https://api.browserbase.com`). Browserbase also runs a remote MCP server (`https://mcp.browserbase.com/mcp`), which is not mounted: it drives live browser sessions through Stagehand rather than adding API coverage.

**Auth:** API key (`apiKey`), sent as the `X-BB-API-Key` header. Create one under Settings at https://www.browserbase.com/settings. Browserbase does not offer user-created OAuth apps. The health check lists projects.

**Gaps:** All 29 mutating operations require approval. Operations that return binary data (session recordings, downloads) return what the API returns and may not be usable as text. Driving a browser over CDP/WebSocket (the `connectUrl` of a session) is outside the REST tools.
