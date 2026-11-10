# A-Leads

B2B prospecting with [A-Leads](https://a-leads.co): advanced people search, company search, similar companies, email finder, personal email finder, phone finder, email verification, reverse email lookup, and bulk people/company search jobs with file status.

**Interface:** custom tools with `fetch` against the official REST gateway `https://api.a-leads.co/gateway/v1` (documented at https://docs.a-leads.co/reference). A-Leads publishes one OpenAPI snippet per endpoint on that site rather than a single document, so the 14 endpoints are hand-written. Search filters are passed through as free-form objects; see the A-Leads reference for the available filter keys.

**Auth:** two methods.
- API key (`x-api-key` header), created in your A-Leads account's API settings. Mounts the 14 REST tools. The health check calls `POST /search/get-all-bulk-files`, a free read that rejects an invalid key.
- OAuth, discovered from the official MCP server `https://mcp.a-leads.co` (Streamable HTTP, dynamic client registration; `scripts/mcp-probe.ts` reports `oauth`, scope `mcp:read`, PKCE S256). Mounts the MCP tools under `mcp` (search, enrichment, saved searches via `aleads_get_saved_searches`, profile and credit usage via `aleads_get_user_details`; see https://docs.a-leads.co/docs/mcp). No manual OAuth app or redirect URI setup is needed. The OAuth flow was not completed here (no real accounts connected).

An account is either key or OAuth, so the REST tools appear for key accounts and the `mcp` tools for OAuth accounts. There is no REST equivalent of the credit-usage or saved-search tools.

**Gaps:** credit-spending tools (including company details, 1 credit per call) and all non-read-only MCP tools require approval.
