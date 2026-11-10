# Beach Day API

Search beaches worldwide and read conditions, water quality, tide predictions, rules, amenities, country coverage and Beach Day Scores.

Interface: the vendor's official OpenAPI 3 document, https://beachdayapi.com/en/openapi.json (server `https://beachdayapi.com/v1`).

Auth: API key only. Create one in the Beach Day API dashboard at https://beachdayapi.com; it is sent as `Authorization: Bearer <key>`. Requests spend the account's credits (402 when exhausted). The vendor offers no OAuth.

Gaps: the account health check calls `/countries/`, which needs a valid key. It costs 1 credit per health check (vendor docs), and an account with a 0 balance fails health with HTTP 402 even when the key is valid. `/v1/health` is free but unauthenticated, so it cannot validate the key; the free `get_account_status` exists only on the MCP server.
