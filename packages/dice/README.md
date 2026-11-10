# Dice

Search Dice's tech-job database with filters for role, company, location and employment type.

**Interface:** Dice's official remote MCP server, `https://mcp.dice.com/mcp` (Streamable HTTP). Dice publishes no public REST, GraphQL or OpenAPI developer surface, so the MCP server is the only option. Tools are discovered from the server at runtime; tools not marked read-only require approval.

**Auth:** None. The server answers anonymous requests (`scripts/mcp-probe.ts` verdict `anonymous`), so the package declares no account.

**Known gaps:** Job search only; no applying, profile or employer/recruiter features.

Icon: Dice's official app icon (`android-chrome-192x192.png` from dice.com), since Simple Icons has no Dice entry.
