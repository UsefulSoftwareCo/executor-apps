# Audioscrape

Search and retrieve speaker-attributed audio, transcripts, entities, trending
content and charts from Audioscrape's public and workspace content, plus
transcription of your own uploads and dataset listing.

**Interface:** Audioscrape's official remote MCP server, `https://mcp.audioscrape.com`
([docs](https://www.audioscrape.com/docs/mcp)). Audioscrape publishes no OpenAPI
document, so MCP is the richest official interface. Only the documented read tools that the server also marks read-only skip
approval; `transcribe_audio`, `create_share_link` and any unknown tool always
require approval. OAuth requests the scopes `mcp:search mcp:read profile`.

**Auth**

- OAuth 2.1 with PKCE and dynamic client registration, discovered from the
  server's metadata. No OAuth app needs to be created by hand; add the redirect
  URI Executor shows if the server asks for one.
- API key sent as a bearer token (the vendor's documented path for headless
  agents). A workspace admin opens the workspace on
  <https://www.audioscrape.com>, goes to the API Keys tab and selects Create
  key. The key is workspace-scoped: it sees the public corpus plus that
  workspace's private audio.

**Known gaps:** the REST API is not mounted; only the MCP tool set is exposed.
