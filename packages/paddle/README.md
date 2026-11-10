# Paddle

Covers the Paddle Billing API: products, prices, customers, addresses, businesses, subscriptions, transactions, discounts, adjustments, payouts, reports, notification settings and simulations. 99 tools, all mutations require approval.

Interface: OpenAPI, from Paddle's official document at https://raw.githubusercontent.com/PaddleHQ/paddle-openapi/main/v1/openapi.yaml. The document lists both the sandbox and live servers; each account picks one and the package pins requests to that origin.

Auth: API key only. Paddle has no user-created OAuth apps. Create a key in Paddle under Developer tools > Authentication and grant it the permissions you need; sandbox and live keys are separate, so choose the matching `environment` (`live` or `sandbox`) when connecting. Requests are sent as a Bearer token to `api.paddle.com` or `sandbox-api.paddle.com`.

Known gaps: the health check calls `/event-types`, so the key needs that read permission. Paddle Classic is a different API and is not covered. Paddle also offers hosted MCP servers (`https://mcp.paddle.com/mcp`), not used here because the OpenAPI document is broader.
