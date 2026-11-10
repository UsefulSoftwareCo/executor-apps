# Ticketmaster

Search live events, attractions, venues and classifications (segments, genres, sub-genres) with the Ticketmaster Discovery API v2. All operations are read-only.

**Interface:** OpenAPI. The document in `openapi.ts` is Ticketmaster's own public swagger 2.0 file (`https://raw.githubusercontent.com/ticketmaster-api/ticketmaster-api.github.io/dev/_data/orgs/discovery-api/v2/api.json`), converted to OpenAPI 3.0 with `swagger2openapi` 7.0.8 (`--patch`). Only the host and security were changed afterwards: the `/discovery/v2` prefix was removed from path keys (it duplicates the basePath), the server is set to `https://app.ticketmaster.com/discovery/v2` (the swagger lists `www.ticketmaster.com`), and the `apikey` query-parameter scheme was added because the swagger declares none.

**Auth:** API key only. Create a free account at https://developer.ticketmaster.com, then copy the Consumer Key from My Apps. Ticketmaster has no OAuth for third-party Discovery use.

**Known gaps:** The Commerce and Publish APIs need partner credentials and are not included. Ticketmaster's partner MCP server (`https://partner-mcp.ticketmaster.com/mcp`) answers 403 to unauthenticated clients and has no public auth docs, so it is not used.
