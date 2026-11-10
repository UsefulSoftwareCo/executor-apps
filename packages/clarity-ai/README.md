# Clarity AI

Clarity AI's SFDR Check 2.0: search funds by name, ISIN or CUSIP, simulate how they might be classified under the European Commission's proposed SFDR 2.0 framework, and interpret the contribution and exclusion flags in plain language. Results are simulations of a proposal, not final rules.

**Interface:** Clarity AI's official remote MCP server, `https://clarity-sfdr20-mcp.pro.clarity.ai/mcp` (Streamable HTTP). Source: https://clarity.ai/sfdr-20-check/

**Auth:** none. The server answers anonymously (confirmed with `scripts/mcp-probe.ts`), so the app declares no account. Tools that are not marked read-only require approval.

**Known gaps:** Clarity AI's separate REST API (`https://api.clarity.ai/clarity/v1`, API key/secret exchanged at `/oauth/token`) needs an enterprise subscription and is not included.
