# Bandwidth

Messaging, voice, multi-factor authentication, phone number lookup, toll-free verification, 10DLC campaigns, accounts, applications, end-user management, voice debug logs, call intelligence and insights for Bandwidth.

Interface: the official OpenAPI documents Bandwidth publishes at https://dev.bandwidth.com/docs/tools/openapi-specs/ (`https://dev.bandwidth.com/spec/<name>.yml`), one per product, mounted under separate keys of one router (about 165 tools). The official Bandwidth MCP server (https://github.com/Bandwidth/mcp-server) only runs locally over stdio, so it is not used.

## Auth

- **API credential (Basic)**: the username and password of an API credential plus your account ID. Create it in the Bandwidth App under Account > API Credentials (https://dev.bandwidth.com/docs/credentials). The account ID is used for the connection health check.
- **OAuth 2 client credentials**: the Client ID (`CLI-...`) and Client Secret of the same API credential, exchanged at `https://api.bandwidth.com/api/v1/oauth2/token` for a bearer token. There is no redirect URI. Tokens are accepted by all hosts below.

Hosts: `api.bandwidth.com`, `messaging.bandwidth.com`, `voice.bandwidth.com`, `mfa.bandwidth.com`, `insights.bandwidth.com`.

## Known gaps

- The Phone Number Dashboard (Numbers, Number Management, porting, sip peers via `dashboard.bandwidth.com`, XML) and Global API specs are not mounted; the Accounts and Applications specs offer XML and JSON bodies.
- Tool names take an `accountId` parameter; it is not filled in from the connection.
- OAuth connections skip a live health call; Basic connections check the applications list.
