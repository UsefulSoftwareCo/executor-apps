# Contentsquare

Query Contentsquare experience-analytics projects and metrics from an agent. Tools are whatever Contentsquare's hosted MCP server exposes.

Interface: Contentsquare's official remote MCP server, `https://api.contentsquare.com/mcp` (streamable HTTP). Docs: https://support.contentsquare.com/hc/en-us/articles/41563169756945-How-to-set-up-and-use-Model-Context-Protocol-MCP

Auth: OAuth 2.0 with PKCE and dynamic client registration, discovered from the server's metadata (scope `metrics`). There is nothing to create by hand: connect and sign in to Contentsquare. You only see projects your Contentsquare user can access, and your Contentsquare plan must include MCP tool calls. Contentsquare may apply a shared per-account tool-call quota (reported by a search summary, not confirmed on the vendor page, which was not readable). Access tokens last one hour and are refreshed automatically. The OAuth redirect URI is Executor's callback.

Known gaps: the separate REST APIs (Data Export, Metrics, Enrichment) are not included: no public OpenAPI document was found at a stable URL (the vendor docs were not reachable to confirm), and integrations.sh lists them as requiring server-to-server client credentials. Tools that are not read-only ask for approval.
