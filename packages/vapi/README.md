# Vapi

Build and run voice AI agents with Vapi: assistants, calls, chats, phone numbers, tools, squads, files, knowledge bases, campaigns, evals and analytics.

**Interface:** OpenAPI, Vapi's official document at https://api.vapi.ai/api-json (OpenAPI 3.0, 74 paths). Vapi also offers an official MCP server (https://mcp.vapi.ai/mcp); its tool count was not compared because it requires an API key to list tools. The REST API is used because it is the vendor's primary API and covers 143 operations.

**Auth:** API key. Create a private API key in the Vapi dashboard (https://dashboard.vapi.ai, API Keys) and paste it as the private API key. It is sent as a Bearer token to `api.vapi.ai`. Vapi has no user-created OAuth apps. Mutations (create, update, delete, start calls) require approval.

**Known gaps:** Public (client-side) keys are not supported. Webhook payloads Vapi sends to your server are not tools.
