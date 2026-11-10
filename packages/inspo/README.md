# Inspo

Design-reference search for coding agents: search an archive of captured production websites (about 800 sites, with desktop and mobile screenshots), and read each site's palette, type ramp, components and design system, find similar sites, search by color, and fetch reference component JSX.

Interface: Inspo's official remote MCP server at `https://inspomcp.dev/api/mcp` (Streamable HTTP), documented at https://inspomcp.dev/. The target "Inspo MCP" is the same product, so it is packaged as `inspo`. The 15 tools were enumerated live: `search_screens`, `get_screen`, `get_design_system`, `find_similar`, `compare`, `find_by_color`, `find_examples_for_macrostructure`, `list_collections`, `get_filters`, `get_site_pages`, `find_components`, `get_collection`, `find_reference_components`, `recommend` and `get_reference_jsx`. All are read-only; any tool added later that is not marked read-only requires approval.

Auth: none. `scripts/mcp-probe.ts` reports the server as anonymous, so the package declares no account and needs no key or OAuth app.

Gaps: Inspo has no REST or GraphQL developer API, so only what the MCP server exposes is covered. It is read-only.

Icon: the official Inspo app icon (`https://inspomcp.dev/icon.svg`), an "I" monogram on warm paper with a red period.
