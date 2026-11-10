# Era

Covers Era (era.app), the AI-native personal finance app, through Era Context: linked bank, card and investment accounts, balances, transactions, categorization, knowledge/context, connections and billing workflows. This package also serves the catalog target "Era Context MCP".

**Interface:** Era's official remote MCP server, `https://context.era.app/mcp` (Streamable HTTP). Documentation: https://era.app/help/mcp-server-era-context. Tools are discovered from the server at connect time (Era's docs list 60: Knowledge 9, Accounts 6, Holdings 6, Connections 6, Transactions 11, Insights 6, Billing 10, Referrals 5, Help 1; availability depends on plan). Era does not publish an OpenAPI or GraphQL API.

**Auth:** OAuth 2.1 only, via the server's published metadata and dynamic client registration (public client, PKCE). Create an Era account at https://era.app (Era offers a free start; some billing and other tools depend on the plan) and approve the connection when redirected. The connection registers itself through dynamic client registration (https://context.era.app/oauth/register), so you configure no redirect URI and create no OAuth app. The `mcp:billing-write` scope (subscription changes, upgrades, cancellation) is not requested; billing read tools work, billing changes may be refused. There is no API key and no OAuth app to create. Requested scopes: `mcp:discovery`, `mcp:tools-basic`, `mcp:tools-write`, `mcp:billing-write`, `mcp:resources-read`, `mcp:content-write`, `markets:read`, `content:read`, `offline_access`.

**Approvals:** every tool without a `readOnlyHint` (account edits, transaction changes, billing) requires approval.

**Known gaps:** tools depend on the user's Era plan and linked data; the tool count is whatever the server exposes to the account.
