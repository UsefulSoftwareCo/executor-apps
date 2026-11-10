# Reteno

Reteno is an omnichannel customer engagement platform (push, in-app, email, SMS, app inbox). This package covers its contacts, segments, events, message templates, sending and analytics.

**Interface:** Reteno's official hosted MCP server, `https://mcp.reteno.com` (https://docs.reteno.com/reference/reteno-mcp-server). The server is a research preview, and its tools map to Reteno API methods. Reteno publishes no OpenAPI document for its REST API, so the MCP server is the interface. Tools are discovered live from the server.

**Auth:** OAuth 2.0 only. Executor discovers the server's metadata (RFC 8414) and registers a client dynamically, requesting the `reteno.api` scope. Sign in to Reteno in the browser when connecting; no OAuth app needs to be created. The agent acts with the permissions of the signed-in Reteno user, and can read contact personal data. The REST API's Basic auth API key (https://docs.reteno.com/reference/api-keys) is not used, since it does not work against the MCP server.

**Approvals:** every tool not annotated read-only requires approval.

**Gaps:** REST-only endpoints that the MCP server does not expose (for example some order endpoints) are not available. Reteno's docs list 85 MCP tools in 13 groups (https://docs.reteno.com/reference/reteno-mcp-server); the server requires OAuth, so the live `tools/list` count was not reproduced unauthenticated. Tools are discovered live at connection time, so the actual count follows the server. The docs also say the agent "does not trigger bulk campaigns or scheduled sends on your behalf", yet the tool list includes `send_broadcast` (and `send_email_message`, `send_sms_message`, `smart_send_message`). Treat the documented limitation as unreliable: the server exposes broadcast sending, so every such call goes through approval.
