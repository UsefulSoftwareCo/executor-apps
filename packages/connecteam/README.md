# Connecteam

Connecteam workforce management: users, schedulers and shifts, time clock, time off, forms, chat, quick tasks, jobs, assets, daily notes and company policies.

**Interface:** Connecteam's official OpenAPI 3.1 document, https://api.connecteam.com/openapi.json (documented at https://developer.connecteam.com). Connecteam also hosts an MCP server at https://developer.connecteam.com/mcp, but it is a docs and API helper for code editors; the OpenAPI document covers more operations.

**Auth:**
- API key: in Connecteam open Settings > API Keys > Add API key (https://developer.connecteam.com/docs/authentication-1). Sent as the `X-API-KEY` header.
- OAuth 2.0 client credentials: Integration Center > OAuth 2.0 > Create app, then paste the Client ID and Client Secret. The token request asks for every scope listed in `index.ts` (all 64 Connecteam scopes), and Connecteam rejects a token request with 403 "Unauthorized scopes requested" if the app lacks any of them. Create the OAuth app with every scope selected; scopes cannot be edited after creation. If you do not want to grant everything, use the API key instead. There is no redirect URI; this is a server-to-server grant.

Mutations require approval.

**Known gaps:** only the global host `api.connecteam.com` is targeted. Australian clients must use `api-au.connecteam.com` and are not supported. Plan rate limits apply per account: 5/min and 100/day on SBP, 100/min and 10,000/day on Expert, 200/min and 20,000/day on Enterprise. Exceeding either returns HTTP 429.
