# Retell AI

Build and manage Retell AI voice agents from Executor: agents, phone and web calls, phone numbers, Retell LLMs, conversation flows, knowledge bases, voices, batch calls, chat and tests.

**Interface:** OpenAPI, Retell's official document at https://docs.retellai.com/openapi.yaml (server `https://api.retellai.com`). Every mutation asks for approval; read-only search and list endpoints that Retell exposes as POST (list agents, chats, calls, contacts, community voices, app tool schema) do not.

**Auth:** API key (bearer token). Create one in the Retell dashboard under API Keys (https://dashboard.retellai.com). Retell offers no user-created OAuth apps, so there is no OAuth method.

**Icon:** Retell's official 192px app icon from docs.retellai.com (Retell publishes no standalone SVG mark).

**Gaps:** WebSocket surfaces (custom LLM websocket) and webhooks are not tools. The MCP server at https://chatgpt-app.retellai.com/mcp is not used because the OpenAPI document covers more.
