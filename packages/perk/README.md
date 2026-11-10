# Perk

Perk (formerly TravelPerk) is a corporate travel and spend platform. This package exposes Perk's official remote MCP server: trips and itineraries, flight, hotel, train and car search, expenses, invoices, reporting, travel policy, cards and Perk Events.

**Interface:** official MCP server at `https://mcp.perk.com/api/mcp/mcp` (docs: https://developers.perk.com/docs/perk-mcp). Tools are discovered live from the server. Perk's REST APIs (Travel, Spend, SCIM) are documented on https://developers.perk.com but the portal publishes no downloadable OpenAPI document, so they are not mounted.

**Auth:** OAuth 2.0 authorization code with PKCE and dynamic client registration, discovered from the server's metadata, so no OAuth app has to be created by hand. Sign in with a Perk account and approve the requested scopes (`user:read`, `trip:read`, `trips:write`, `expenses:read`, `spend:expenses:write`, `report:write`, `events:write` and others). Reporting tools need an account with reporting access (analyst or account admin). Redirect URI: the one shown on Executor's connect page.

**Approvals:** every tool without a `readOnlyHint` asks for approval first.

**Gaps:** no API-key auth (the MCP server accepts OAuth only); REST-only endpoints (SCIM, webhooks, cost centers, custom fields) are not covered. Icon is Perk's official 192px app icon from perk.com.
