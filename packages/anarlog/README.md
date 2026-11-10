# Anarlog

Access your Anarlog meetings, notes and transcripts from agents.

Interface: Anarlog's official remote MCP server at https://api.anarlog.so/mcp (docs: https://docs.anarlog.so/reference/api-cloud#remote-mcp). Anarlog publishes no OpenAPI document. Tools are discovered from the server at runtime; those without `readOnlyHint` require approval.

Auth: OAuth only. The server publishes OAuth protected-resource metadata (authorization server is Anarlog's Supabase auth) with dynamic client registration, so no OAuth app needs to be created. Executor's redirect URI is registered automatically when connecting. There is no API-key option.

Icon: Anarlog's official app icon (https://anarlog.so/apple-touch-icon.png, 180px).

Known gaps: the tool list depends on the server, which could not be enumerated without an authenticated account.
