# Wispr Flow

Wispr Flow Notetaker data for agents: meeting summaries, notes, transcripts, attendees and tasks, Scratchpad notes, calendar events with linked recordings, recurring meetings and upcoming-meeting pre-reads. The catalog target "Wispr Flow MCP" is this same product.

**Interface:** Wispr's official remote MCP server at `https://api.wisprflow.ai/connect/mcp` (probe verdict: `oauth`), documented at `https://docs.wisprflow.ai/articles/9551372685-connect-an-mcp-client-to-wispr-flow-remote-mcp-server`. The server is read-only and cannot read dictation history. The tool list is served by the live server and was not enumerated here because it requires a signed-in account. Wispr has no public OpenAPI or GraphQL API (its older API is sunsetted), so MCP is the only official interface. The community write companion `abhaymettu/wispr-flow-write-mcp` is unofficial and is not used. Tools not annotated read-only require approval.

**Auth:** OAuth 2.0 with PKCE (S256) and dynamic client registration, discovered from the server's metadata (authorization server `https://mcp-auth.wisprflow.com`; scopes `openid offline_access`, supplied by the framework from the metadata). The resource is pinned to the exact MCP URL with no trailing slash, which Wispr says breaks sign-in. Sign in with your Wispr Flow account; no OAuth app or API key needs creating. The Wispr Flow Mac or Windows app is used to start setup (Settings, MCP), and the account requires Notetaker and MCP access; Wispr may prompt to enable Cloud Sync, which is only needed in some cases (Scratchpad over MCP does not need it). An organization policy can disable MCP, including for already-authorized clients, and an active personal or organization HIPAA BAA blocks every MCP feature. On Enterprise, an admin may need to enable the connector.

**Gaps:** A full OAuth connect was not tested end to end, and the exact tool names were not verified against the live server.

**Icon:** Wispr Flow's official apple-touch icon (256px PNG from `https://cdn.prod.website-files.com/682f84b3838c89f8ff7667db/68d27d1a8a10f417b5644527_flow-wc-v2.png`, linked from wisprflow.ai); Simple Icons has no Wispr entry.
