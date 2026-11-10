# Bolna

Bolna builds conversational voice AI agents. This package covers agents, outbound calls and call executions (transcripts, raw logs), batches, dispositions, knowledgebases, phone numbers, SIP trunks, sub-accounts, workflows and workflow campaigns, and documentation search (Bolna's docs claim 91 tools, but their tool tables list 87 entries, so treat the count as approximate).

Interface: Bolna's official hosted MCP server, `https://mcp.bolna.ai/api/mcp` (docs: https://www.bolna.ai/docs/mcp-server). Bolna's REST API (`https://api.bolna.ai`) is documented, but its OpenAPI document is not served at any public URL we could find, so the MCP server, which wraps the same API one-to-one, is used. Tools are approval-gated unless they declare `readOnlyHint`.

Auth:
- API key: create it in the Bolna dashboard (https://platform.bolna.ai, Developers, API Keys). Main-account keys start with `bn-`, sub-account keys with `sa-`. It is sent as a Bearer token.
- OAuth: the server publishes OAuth metadata (Supabase auth, dynamic client registration, PKCE), so Executor discovers and registers a client itself. Use the redirect URI Executor shows when asked.

Known gaps: the tool count is not verified: Bolna's docs say 91 tools while their tool tables list 87 (85 account tools plus 2 docs tools), and no live tool listing was obtained because it needs credentials. Every tool also accepts an optional `api_key` argument to act as a sub-account for one call.
