# Swoogo

Events, registrants, sessions, speakers, sponsors, contacts, packages, discount codes, transactions, data lists, pages, call for speakers and webhooks for the Swoogo event management platform.

Interface: the official OpenAPI 3.1 document published with Swoogo's developer docs, https://developer.swoogo.com/api-reference/openapi.yaml (167 tools, 92 of them mutations that need approval). Swoogo's MCP server at developer.swoogo.com/mcp only serves the documentation, so it is not used.

## Auth

- **OAuth 2 client credentials**: the consumer key (client ID) and consumer secret (client secret) from My Profile > API Credentials in Swoogo (https://www.swoogo.com/manage/profile/api). They are exchanged at `https://api.swoogo.com/api/v1/oauth2/token` with HTTP Basic for a bearer token that lasts 30 minutes. There is no redirect URI.

Host: `api.swoogo.com`.

## Known gaps

- The token endpoint itself is skipped (Executor performs that exchange).
- Connections skip a live health call; the credential exchange proves the key and secret.
- Rate limit is 2,000 credits per 10 minutes per credential; list calls cost 10.
