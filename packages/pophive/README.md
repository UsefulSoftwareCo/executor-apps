# PopHIVE

Yale's Population Health Information Visual Exchange: harmonized US public health surveillance data covering disease, vaccination and health outcome trends. Covers the "PopHIVE MCP" catalog target.

Interface: PopHIVE's official remote MCP server at `https://mcp.pophive.org/mcp` (Streamable HTTP), documented in the setup guide at https://www.pophive.org/docs/pophive-mcp-guide.pdf and https://www.pophive.org/ai-access. Tools are read live from the server. They are compare, get_coverage, get_current_status, get_data, get_map, get_overview and get_trend; they query aggregate data. Any tool not marked read-only requires approval.

Auth: none. The vendor states no account, API key or password is needed, and `scripts/mcp-probe.ts` reports the server as anonymous, so the package declares no account.

Gaps: PopHIVE has no public REST API (only the MCP server and file downloads from the data catalog), so only what the MCP server exposes is covered. Data is US-only aggregate surveillance.

Icon: the PopHIVE mark from the official site favicon SVG (https://www.pophive.org/img/meta/favicon.svg).
