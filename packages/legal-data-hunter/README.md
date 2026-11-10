# Legal Data Hunter

Search and retrieve court decisions, legislation and doctrine from official
government sources in 230+ jurisdictions: 7 tools (`search`, `resolve_reference`,
`get_document`, `discover_countries`, `discover_sources`, `get_filters`,
`report_source_issue`).

Interface: Legal Data Hunter's official remote MCP server (Streamable HTTP),
`https://legaldatahunter.com/mcp` (https://legaldatahunter.com/llms.txt). The
REST API (`POST /v1/search`, bearer key) is not wrapped; no OpenAPI document is
published. This package also covers the catalog target "Legal Data Hunter MCP".

Auth: OAuth 2.0 with dynamic client registration and PKCE (scope `mcp`),
discovered from `https://legaldatahunter.com/.well-known/oauth-protected-resource`.
Sign in with your Legal Data Hunter account when connecting; no OAuth app needs to
be created. Free accounts get a daily search quota. The redirect URI is
registered dynamically.

Known gaps: the MCP endpoint was probed unauthenticated only (401 with OAuth
metadata), so the tool list comes from the vendor's llms.txt. Tools other than
read-only ones require approval.
