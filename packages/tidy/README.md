# TIDY

Manage [TIDY](https://www.tidy.com) cleaning and maintenance automation: request, list, update and cancel jobs, list and create addresses and their to-do lists, add pros and manage guest reservations.

**Interface:** OpenAPI, loaded live from TIDY's official document at https://www.tidy.com/api/openapi.json (server `https://api.tidy.com/v1`). TIDY publishes no remote MCP server (its MCP server is a local `npx` package), so the REST API is used. The document covers 6 paths (jobs, addresses, to-do lists, pros, reservations).

**Auth:** API key only (TIDY has no OAuth for customers). Generate one in your TIDY account under Developers, then API Keys. It is sent as `Authorization: Bearer <key>`, as TIDY's authentication guide specifies. The OpenAPI document declares an `X-API-Key` header instead; this package follows the guide.

**Known gaps:**
- The document is small and does not include the booking endpoint or the newer natural-language `message-tidy` endpoint.
- The document and the guide disagree on the auth header and the unauthenticated endpoints could not be probed (they return 404), so the Bearer scheme is untested against a live key.
- Operations have no `operationId`, so tool names are method-based.
