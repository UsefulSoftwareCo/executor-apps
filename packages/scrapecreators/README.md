# ScrapeCreators

Scrapes public social media data through the ScrapeCreators API: profiles, posts, videos, comments, ads and search across TikTok, Instagram, YouTube, X, LinkedIn, Facebook, Reddit and many other platforms, plus account credit and usage endpoints.

Interface: OpenAPI, the vendor's official document at https://docs.scrapecreators.com/openapi.json (server https://api.scrapecreators.com). The vendor also publishes an official remote MCP server at https://api.scrapecreators.com/mcp (docs: https://docs.scrapecreators.com/integrations/mcp). The OpenAPI document was chosen because it covers the full 198-operation REST surface, while the MCP server's tool coverage is not disclosed. If the MCP server is found to cover materially more, switch to or add it. Every operation is a read of public data; the few POST operations are treated as mutations and require approval.

## Auth

The REST API accepts only the `x-api-key` header; there is no OAuth for the REST API. The separate official MCP server uses OAuth. Create a key in the dashboard at https://app.scrapecreators.com; it is sent as the `x-api-key` header. Each request consumes credits from the account. The connection health check calls `GET /v1/account/credit-balance`, which the vendor docs list at 1 credit per request, so each connection check costs 1 credit.

## Known gaps

No OAuth and no per-user access: all data is public. Heavy endpoints are billed per call.
