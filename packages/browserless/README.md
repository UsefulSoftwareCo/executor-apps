# Browserless

Cloud headless browsers from [Browserless](https://www.browserless.io): screenshots and PDFs, content and scrape APIs, smart scrape, search, site maps, crawling, custom Puppeteer functions, downloads and exports, unblock, persistent sessions and profiles, BQL on sessions, and the browser agent.

**Interface:** the account's auth method picks the interface.
- API token accounts use Browserless's official OpenAPI document, [`https://docs.browserless.io/openapi.json`](https://docs.browserless.io/openapi.json) (public, no token needed to read it; v2.57.0, 87 paths, 100 operations), against `https://production-sfo.browserless.io`. 41 tools are generated. The `token` query parameter (`tokenAuth`) is injected by Executor from the stored credential and is not a tool input. The document repeats many operations under `/chrome`, `/chromium` and `/edge`; the `/chromium` ones are kept.
- OAuth accounts use Browserless's official hosted MCP server, `https://mcp.browserless.io/mcp` ([docs](https://docs.browserless.io/mcp/browserless-mcp-server/setup.md)). It exposes 14 tools per the vendor docs (the count is not verified against a live `tools/list`). OAuth is only offered by the MCP server, not by the REST API, which is why both interfaces are mounted.

**Auth**
- API token: copy it from the [Browserless account dashboard](https://browserless.io/account/). It is sent as the `token` query parameter on REST calls.
- OAuth: the MCP server's authorization server metadata (`https://mcp.browserless.io/.well-known/oauth-authorization-server`) advertises dynamic client registration (`https://mcp.browserless.io/oauth/register`) with S256 PKCE, so Executor registers the client automatically and no OAuth app needs to be created. Sign in with your Browserless account.

**Approvals:** on the REST tools every mutation (POST, PUT, DELETE) asks for approval; GET tools do not. On the MCP tools, approval is required unless the server marks the tool `readOnlyHint: true`. The vendor docs show no tool annotations, so expect every MCP tool, including the account ones, to ask for approval until a live authenticated `tools/list` shows otherwise (not checked; no credentials were used).

**Skipped from the OpenAPI document (not request/response HTTP):** WebSocket and CDP endpoints (`/devtools`, `/json`, `*/playwright`, `/session/connect`, `/function/connect`, `/reconnect`, `/stealth/reconnect`, and the WebSocket upgrades documented as GET on `/`, `/chromium`, `/stealth`, `/chromium/agent`), BQL endpoints with `?(/*)` routing on `/chromium/bql` and `/stealth/bql` (use `session/bql` instead), interactive `/live` viewers, the licensed `/chrome` and `/edge` builds, and the self-hosted `/browser/*`, `/chromium/cli` and `/integrations/onepassword` endpoints. The `env` schema of `BrowserServerOptions` and empty request bodies on GET/DELETE operations are patched so the document compiles.

**Known gaps:** both interfaces default to the SFO region; London and Amsterdam accounts need a different base URL (REST) or the `x-browserless-api-url` header (MCP), which this package does not set.
