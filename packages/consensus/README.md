# Consensus

Search peer-reviewed research papers and run the Consensus research agent from Executor. This package covers both the Consensus and Consensus MCP catalog targets.

**Interface:** Consensus's official remote MCP server, `https://mcp.consensus.app/mcp`. Tools are discovered live from the server. Tools without `readOnlyHint` require approval.

**Auth**

- OAuth only: sign in with your Consensus account. The server publishes OAuth metadata and supports dynamic client registration (PKCE S256), so no OAuth app has to be created. Only the `search` scope is requested, matching the server's WWW-Authenticate challenge; the `profile` scope is advertised in metadata but not requested.

**Known gaps:** Consensus's REST API and enterprise API keys are sales-issued, not self-serve, so they are not supported. The vendor docs (docs.consensus.app) return 403 to automated fetches, so this package relies on the live OAuth discovery documents.
