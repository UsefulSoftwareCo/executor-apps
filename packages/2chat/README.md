# 2chat

WhatsApp (Web and Business API), SMS, channels, conversations, groups, status
stories, catalogs, contacts, WABA templates and call history in 2Chat: 36
tools, such as `send_whatsapp_message`, `send_waba_message`, `send_sms`,
`list_whatsapp_conversations`, `create_contact` and `get_call_history`.

Interface: 2Chat's official remote MCP server, `https://mcp.2chat.io/mcp`
(https://developers.2chat.co/docs/MCP/setup). 2Chat publishes no official
OpenAPI document (the REST API at `https://api.p.2chat.io/open/...` is
documented by hand and in a Postman collection), so the MCP server is used.
Tools are whatever the server lists for the account.

Auth:

- OAuth (`oauth`): the only method the MCP server accepts; it has no API-key
  option. The server publishes OAuth metadata and dynamic client registration
  (authorization code with PKCE), so Executor registers its own client and the
  user signs in with their 2Chat account in the browser. Scopes: `openid`,
  `offline_access`. If registration is refused, use Executor's redirect URI shown
  on the connect page.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: the REST API key (`X-User-API-Key`) is not accepted by the MCP
server, so key-only users cannot connect. Webhook subscription management and
virtual-number purchasing are not exposed by the MCP server. Account health only
verifies the token reaches the MCP server.
