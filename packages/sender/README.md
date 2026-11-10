# Sender

Subscribers, groups, segments, email campaigns, automation workflows, sending domains and the image library in Sender (sender.net).

**Interface:** Sender's official remote MCP server, `https://mcp.sender.net/mcp` (docs: https://api.sender.net/mcp/), about 40 tools discovered at runtime. Sender's REST API (`https://api.sender.net/v2`, bearer API token) is documented only as web pages with no published OpenAPI document, so it is not used; the MCP server covers the common subscriber, group, segment, campaign and workflow operations. Non-read-only tools require approval.

**Auth:** OAuth only (no API key method). Credentials go to two hosts: the MCP server `mcp.sender.net` and the authorization server `auth.sender.net` (authorize, token, refresh and client registration), and both are declared in the app's `hosts`. The server publishes RFC 9728 protected-resource metadata and RFC 8414 authorization-server metadata (`https://auth.sender.net`) with dynamic client registration and the `mcp:use` scope, so Executor discovers everything from the URL and no OAuth app needs to be created; the redirect URI is registered automatically. Each tool is checked against the connected user's Sender role permissions. The vendor's separate REST API tokens (Sender account settings > API access tokens) do not work against the MCP server, so no apiKey method is offered.

**Known gaps:** The REST-only endpoints (transactional campaigns and sends, custom events, custom fields, account webhooks, campaign statistics lists) are not exposed. Sending a campaign is not available through the MCP server; it creates drafts only.

Icon: the Sender mark extracted from the logo SVG on https://api.sender.net.
