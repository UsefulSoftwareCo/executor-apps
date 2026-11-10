# Anakin

Web data for agents: scrape a URL to markdown or structured JSON, search, map and crawl sites, run multi-source agentic research, run Wire actions against 940+ sites, create website monitors, compare AI answer engines (ChatGPT, Gemini, Google AI Overview), and manage saved browser sessions.

**Interface:** Anakin's official remote MCP server, `https://mcp.anakin.io/mcp` (Streamable HTTP). Anakin documents 21 tools (`scrape`, `search`, `map`, `crawl`, `agentic_search`, `wire_discover`, `wire_catalog`, `wire_read_action`, `wire_write_action`, `wire_identities`, `wire_login`, `wire_build`, `monitor_create`, `monitor_list`, `monitor_changes`, `monitor_control`, `ai_visibility_search`, `ai_visibility_sources`, `session_list`, `session_delete`, `browser_task`); the app lists whatever the server returns. Anakin publishes no OpenAPI document (https://api.anakin.io/openapi.json is 404), so MCP gives the broadest official tool set. Docs: https://anakin.io/docs/integrations/ai-agents/claude-connector.

**Auth:** OAuth 2.1 with dynamic client registration, discovered from the server's metadata (authorization server `https://anakin.io`). Sign in with your Anakin account when connecting; Anakin mints a dedicated, revocable key for the connection. No OAuth app needs to be created by hand. The MCP server rejects raw `X-API-Key` keys (it expects a JWT bearer), so there is no API-key method here; the REST API at `https://api.anakin.io/v1` takes `X-API-Key` (https://anakin.io/account#developer) but is not exposed by this package.

**Approvals:** every tool not annotated `readOnlyHint` asks for approval (writes, logins, monitors, browser tasks).

**Known gaps:** REST-only features (webhook endpoint management, browser API websockets, screenshot download, batch scrape polling) are not in the MCP tool set. Tool calls consume Anakin credits. Anakin's keyless "Zero Touch" tier needs no account but only exposes four read tools and is not used here. Anakin publishes no SVG logo; the icon is a vector redraw of the official mark (served at https://anakin.io/anakin.png).
