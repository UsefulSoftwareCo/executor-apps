# Rydoo

Covers the Rydoo expense management API: expenses (add, report, reject, reimburse, export, receipts), users, user groups and roles, branches, groups, projects, transactions, categories, custom fields and list items, guests, external organizations, linked accounts, exchange rates, trips, reimbursements, payment methods and approval workflows, 111 tools in all (56 mutations, each requiring approval).

Interface: OpenAPI 3.0 from Rydoo's official developer reference at https://developers.rydoo.com/reference. Rydoo publishes no single OpenAPI file; each endpoint page embeds its own OpenAPI fragment, so `spec.ts` is a merged snapshot of all of them (pages listed in https://developers.rydoo.com/llms.txt, downloaded 2026-10-12). Refresh it by re-merging those pages. The base URL is `https://api.rydoo.com`.

Auth: one method, OAuth 2 client credentials. Ask Rydoo (your account manager or support) for a Client ID and Client Secret for your company. Executor exchanges them at `https://accounts.rydoo.com/connect/token` with Basic client authentication and renews the token as it expires (tokens last a few minutes). The token request asks for the scopes `api_xpd2` and `openid`, which Rydoo's per-endpoint OpenAPI declares for its client_credentials scheme. There is no browser redirect, so no redirect URI is needed. Rydoo rate-limits the token endpoint to 25 requests per minute and the API to 500 per minute.

Rydoo also runs an official MCP server at https://mcp.rydoo.com (beta). It needs interactive user OAuth with a whitelisted DCR/CIMD client and covers fewer operations than the REST API, so OpenAPI with company client credentials was chosen.

Known gaps: Rydoo's SFTP import/export feeds and the expense webhook (Rydoo calls you) are not tools. The icon is Rydoo's official app icon (156px PNG from rydoo.com), since Simple Icons has no Rydoo mark and the SVG logo is a wordmark.
