# Jentic

Search Jentic's public catalog of agent-ready APIs and inspect their operations (`whoami`, `search_apis`, `inspect_operation` and related tools).

**Interface:** Jentic's official hosted remote MCP server, `https://api.jentic.com/mcp` (docs: https://docs.jentic.com/guides/mcp/remote-mcp/). Tools are discovered from the server at runtime; tools without a read-only hint require approval. Jentic's docs state the hosted server handles discovery only (it searches the public directory and does not execute against upstream APIs); execution tools exist on self-hosted Jentic One instances.

**Auth:** OAuth only. The server publishes protected-resource metadata and supports dynamic client registration (scopes `openid email profile`, PKCE S256), so Executor discovers everything from the URL and the redirect URI is registered automatically. The agent API key route in Jentic's docs applies only to self-hosted instances, which this package does not target.

**Known gaps:** Self-hosted Jentic One (`https://<host>/mcp`, off by default) is not supported because the URL is fixed. The Arazzo Runner and API Scorecard CLIs are not exposed.

Icon: Jentic's published apple-touch icon (`https://jentic.com/apple-touch-icon.png`, 180px); Simple Icons has no Jentic mark.
