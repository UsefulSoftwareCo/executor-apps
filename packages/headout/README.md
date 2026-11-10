# Headout

Search Headout's catalogue of tours, attractions, shows and activities worldwide.

**Interface:** Headout's official public MCP server, `https://aviator.headout.com/mcp/` (listed on headout.com via integrations.sh). Tools: `get_experiences_by_query` and `get_experiences_by_collection`, both read-only.

**Auth:** none. The server answers anonymous requests (mcp-probe verdict `anonymous`), so no account is declared. Any non-read-only tool added later requires approval.

**Icon:** Headout's official 1024px app icon from https://www.headout.com/static/favicons/favicon-1024x1024.png.

**Known gaps:** Headout's Partner API (`https://www.headout.com/api/public/v2`, `Headout-Auth` API key from the affiliate program) covers inventory, pricing and bookings, but Headout publishes no OpenAPI document and its docs repository was not reachable, so it is not wrapped. Booking is therefore not available.
