# SeatGeek

Discover concerts, sports and theater events, performers and venues, and find tickets on SeatGeek.

**Interface:** SeatGeek's official remote MCP server, `https://chatgpt-app.seatgeek.com/mcp` (listed in integrations.sh for seatgeek.com). Tools are whatever the server advertises.

**Auth:** none. The server answers anonymously (verified with `scripts/mcp-probe.ts`: status 200, verdict `anonymous`), so no account is declared. Tools that are not marked read-only require approval.

**Known gaps:** integrations.sh also lists SeatGeek's Platform APIs, but with auth status unknown, no public spec URL, and a description of them as access-controlled (partner/developer-portal access). They are not used, and nothing here claims they lack an OpenAPI document; the vendor's developer portal was not reachable during authoring. Only the MCP server is an official keyless source.

The MCP endpoint sets a DataDome bot-protection cookie. The deployed local Executor listed all three tools (`eventSearch`, `eventCarousel`, `eventListings`, all read-only) with no challenge, so it works from this runtime; a hosted runtime may still be challenged. The tool list is what the server advertised at review time and can change. The icon is Simple Icons' SeatGeek wordmark; SeatGeek's brand page was not checked for a standalone mark.
