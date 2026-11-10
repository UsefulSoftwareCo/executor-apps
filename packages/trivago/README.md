# Trivago

Searches accommodations on Trivago and compares hotel prices across booking sites.

Interface: Trivago's official remote MCP server at `https://mcp.trivago.com/mcp` (Streamable HTTP, "trivago Accommodation Search"). Tools are read live from the server; any tool not marked read-only requires approval. This package also covers the catalog target "Trivago MCP".

Auth: none. `scripts/mcp-probe.ts` reports the server as anonymous, so the package declares no account and needs no key or OAuth app.

Gaps: Trivago has no public developer REST or GraphQL API; only what the MCP server exposes is covered, and no bookings are made.

Icon: the Trivago mark from Simple Icons.
