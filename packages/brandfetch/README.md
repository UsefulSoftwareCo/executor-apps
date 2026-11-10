# Brandfetch

Brand data from Brandfetch: logos, colors, fonts, images and company details by domain, ticker, ISIN, crypto symbol or brand id, plus brand search, batch and transaction lookups, brand context, the viewer endpoint and the agent access offer.

Interface: OpenAPI, Brandfetch's official document at https://docs.brandfetch.com/openapi.json (origin https://api.brandfetch.io). 13 tools compile.

Why not the MCP server: Brandfetch also runs an official remote MCP server at https://mcp.brandfetch.io/mcp (OAuth against https://developers.brandfetch.com, or a dashboard MCP token as a bearer). Its documented tools are `brand_search`, `get_brand`, `get_brand_data`, `get_brands` and `get_brand_context`, which are a subset of what the OpenAPI document offers (it lacks ticker/ISIN/crypto-specific routes, transactions and the viewer). The OpenAPI interface exposes more, so it is used. Its one advantage is brand search without a separate client ID. The tool list above comes from the vendor docs; we did not authenticate to the server.

Auth: API key (`apiKey`), sent as a bearer token. Create one at https://developers.brandfetch.com. Brandfetch's own sign-in for the MCP server is OAuth, but the REST API has no user OAuth flow, so only the API key is offered here. Health check calls `GET /v2/viewer`, which the vendor documents as free (it never consumes API credits).

Brand Search (`searchBrands`) uses a separate Brand Search client ID rather than the API key. It is passed as the `c` input of the tool. The published document puts `?c={clientId}` in the path key, which the tooling cannot compile, so `openapi.ts` patches that one operation to declare `c` as a normal query parameter.

Approvals: `prefetchBrand` and `prefetchBrandByDomain` are HEAD requests. The vendor says they never consume a credit, but they queue a crawl when the brand is not held (and may be throttled), so they are treated as mutations and need approval, like the POST batch and transaction lookups.

Known gaps: `POST /v2/agents/access` (buy agent access) is skipped because it only supports the x402/MPP payment schemes. `GET /v2/agents/access` (the free offer description) is included.
