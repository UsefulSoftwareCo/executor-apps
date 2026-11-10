# Honeybadger

Error tracking and monitoring in Honeybadger: projects, errors and their occurrences, stack traces and affected users, Insights (BadgerQL) queries, dashboards and alarms.

Interface: Honeybadger's official hosted remote MCP server, `https://mcp.honeybadger.io/mcp` (docs: https://docs.honeybadger.io/resources/mcp/). Honeybadger publishes no OpenAPI document for its Data API, so the MCP server is the broadest official interface. Tools that are not marked read-only require approval.

Auth: OAuth 2.0 with dynamic client registration, discovered from the server's metadata (issuer `https://app.honeybadger.io`, PKCE S256, scopes `read` and `write`). No OAuth app needs to be created by hand. During authorization the user chooses the account and whether to grant read-only or read/write access; revoke it under API Access in user settings. The redirect URI is registered automatically.

Known gaps:
- Accounts in the EU region use a separate server (`https://eu-mcp.honeybadger.io/mcp`); this package connects to the US server only.
- Teams, accounts and uptime tools are not yet offered by Honeybadger's MCP server.
- No personal-auth-token (API key) method: the hosted server accepts OAuth only.
