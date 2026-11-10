# AllTrails

Finds hiking, biking and running trails on AllTrails: search trails, and read route details, reviews and photos.

Interface: AllTrails' official remote MCP server at `https://www.alltrails.com/mcp` (Streamable HTTP), listed on integrations.sh. The list is read live from the server and was enumerated and verified: `find_trails_near_location`, `find_trails_within_bounds`, `search_trails_by_name`, `get_trail_details` and `get_trail_weather_overview`, all read-only. The list may change; any tool not marked read-only requires approval.

Auth: none. `scripts/mcp-probe.ts` reports the server as anonymous, so the package declares no account and needs no key or OAuth app.

Gaps: AllTrails has no public REST or GraphQL developer API, so only what the MCP server exposes is covered; nothing is created or changed in a user's AllTrails account.

Icon: the AllTrails mark from Simple Icons.
