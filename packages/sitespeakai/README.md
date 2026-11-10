# SiteSpeakAI

Manage SiteSpeakAI AI agents (chatbots): analytics, question insights, settings, knowledge sources, suggested messages, and the inbox of conversations and captured leads.

**Interface:** SiteSpeakAI's official remote MCP server, `https://api.sitespeak.ai/mcp` (Streamable HTTP), documented at https://sitespeak.ai/docs/managing-your-chatbot/ai-agents. The public REST reference (`https://api.sitespeak.ai/v1`) publishes no OpenAPI document (its `openapi.json` is the Mintlify placeholder), so the MCP server is the richest official source. Tools are discovered live from the server. Tools without a read-only hint require approval.

**Auth**

- API token: create one at https://sitespeak.ai/user/api-tokens and paste it in. It is sent as `Authorization: Bearer <token>`. The token can read and change the account, and the agent can only act on chatbots it has access to.
- OAuth: the server advertises OAuth metadata with dynamic client registration (scope `mcp:use`), so Executor registers a client itself. Redirect URI: use the one Executor shows on the connect page.

**Known gaps:** The REST-only endpoint `POST /v1/{chatbot_id}/query` (ask a chatbot a question) and the agency workspace and webhook endpoints are not covered, since they are not part of the MCP server.
