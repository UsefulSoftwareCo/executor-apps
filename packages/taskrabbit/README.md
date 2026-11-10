# Taskrabbit

Finds and books local Taskrabbit services (home repair, moving, cleaning, handyman, furniture assembly): list the services offered in a location, check availability, pricing and scoping questions for a service, and generate a pre-filled booking deep link.

Interface: Taskrabbit's official remote MCP server (`taskrabbit-booking-assistant`) at `https://mcp.taskrabbit.com/mcp` (Streamable HTTP), listed on integrations.sh. The tools were enumerated live: `list_supported_services`, `check_service_availability` and `generate_deep_link`, all read-only. Any tool added later that is not read-only requires approval.

Auth: none. `scripts/mcp-probe.ts` reports the server as anonymous, so the package declares no account and needs no key or OAuth app.

Gaps: the MCP server only helps scope a task and produces a link; the booking itself is completed by the user on taskrabbit.com. Taskrabbit's partner APIs (Dolly delivery, Home Services) need partner-issued credentials and are not covered.

Icon: Taskrabbit's official app icon (512px, from the App Store listing); Taskrabbit publishes no standalone mark SVG and Simple Icons has none.
