# ScrollStash

ScrollStash competitor ad intelligence for DTC and US ecommerce brands: tracked brands, what changed in their Meta ads and landing pages, and queries over ads, brands and pages, searchable by agents.

**Interface:** ScrollStash's official remote MCP server at `https://mcp.scrollstash.com/mcp` (probe verdict: `oauth`). The vendor's docs list the same server under the host `mcp.storequant.com`; the `scrollstash.com` host serves the same OAuth metadata. ScrollStash also publishes an official OpenAPI 3.1 document (93 paths, `https://api.scrollstash.com/v1/openapi.json`, server `https://api.storequant.com`) that authenticates with `ss_live_` API keys. Its docs state that self-service key creation is not open yet, so users cannot complete that auth themselves and the MCP server is used instead. An OpenAPI package would be a reasonable addition once keys are self-service.

**Tools:** whatever the server lists after sign-in; tools not annotated read-only require approval.

**Auth:** OAuth 2.0 with PKCE (S256) and dynamic client registration, discovered from the server's metadata (`oauth2({ discover, resource })`; the authorization server is the same origin, `https://mcp.scrollstash.com`). Sign in with your ScrollStash account when you connect.

**Gaps:** The tool list was not enumerated because it requires an authenticated session. A full OAuth connect was not tested end to end. Data is Meta Ad Library only, with no spend, reach or ROAS.

**Icon:** ScrollStash publishes no SVG or favicon file; the mark is the layers glyph shown in its site header (a Lucide icon, ISC licence), redrawn as a standalone SVG.
