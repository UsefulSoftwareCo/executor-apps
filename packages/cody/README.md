# Cody

Cody AI (meetcody.ai) assistant API: bots, conversations, messages (including streaming), documents (text, file, webpage), folders and signed upload URLs.

Interface: OpenAPI, Cody's official document at https://developers.meetcody.ai/source.json (base URL `https://getcody.ai/api/v1`). Cody also hosts an MCP server at `https://developers.meetcody.ai/mcp`, but the OpenAPI document covers the whole REST API. Mutations require approval.

Auth: API key only. Create one in Cody under Settings, API Keys, and paste it as the token. It is sent as a bearer token to `getcody.ai`. Cody has no OAuth.

Known gaps: the `/messages/stream` operation returns a server-sent event stream, which a plain tool call cannot consume incrementally; use the non-streaming send message operation.
