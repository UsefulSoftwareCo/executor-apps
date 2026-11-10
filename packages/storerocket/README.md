# StoreRocket

Manage StoreRocket store-locator projects and locations: read the token's user, list projects, and list, read, create, update (PATCH and PUT) and delete locations, including opening hours, custom fields, calls to action and filters.

**Interface:** hand-written tools over StoreRocket's REST API v2 (`https://storerocket.io/api/v2`), documented at https://docs.storerocket.io. StoreRocket publishes no OpenAPI document, MCP server or GraphQL API, so the 8 tools are written by hand from the official docs.

**Auth:** API token only (StoreRocket has no OAuth). Create one at https://storerocket.io/app/api-tokens and tick the permissions the tools need (`location:read`, `location:create`, `location:update`, `location:delete`). It is sent as `Authorization: Bearer <token>`. The connection health check calls `GET /user`.

**Known gaps:**
- Location endpoints need a project on the Business plan with API access.
- The legacy V1 API (including the lead endpoints `/api/leads`) uses a separate legacy token and the token owner's personal project; it is not covered. V2 has no lead endpoints.
- Create/PUT bodies expose the documented core fields; marker, type and cover options described only in the sub-pages are not modelled.
