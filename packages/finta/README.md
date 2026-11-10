# Finta

Finta (finta.io) syncs bank, investment and Stripe data into a database you can query. This package exposes its Developer API v2: user profile, bank connections, accounts and balance history, securities, holdings, investment transactions, transactions (including batch updates), categories and category groups, and rules (including running them). 30 tools, 16 of them mutations that require approval.

**Interface:** OpenAPI 3.0, the official document at https://api.finta.io/v2/openapi.json (server `https://api.finta.io/v2`).

**Auth:** API key (Bearer token). Create it in Finta under the API settings of your account at https://app.finta.io. The API needs storage mode enabled and an active subscription or free trial. The spec also accepts OAuth access tokens issued to authorized apps, but Finta offers no user-created OAuth apps, so only the API key is offered.

**Known gaps:** Finta's official remote MCP server (https://mcp.finta.io/mcp, OAuth with dynamic client registration) is not mounted because the REST API covers the same data.
