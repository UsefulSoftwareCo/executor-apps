# Woodpecker

Cold email and LinkedIn outreach in [Woodpecker](https://woodpecker.co): create, run, pause and delete campaigns, manage prospects, read mailboxes and campaign reports. Two connection methods give two tool sets.

## Interface

- OAuth accounts: Woodpecker's official hosted remote MCP server, `https://api.woodpecker.co/mcp/v1` (endpoint listed on the [Connect Claude](https://developers.woodpecker.co/docs/mcp/connect-claude) docs page; see also the [MCP docs](https://developers.woodpecker.co/docs/mcp)). Mutating tools require approval; tools with `readOnlyHint` do not.
- API-key accounts: hand-written `rest.*` tools over the REST API at `https://api.woodpecker.co/rest` ([docs](https://developers.woodpecker.co)): campaigns (list, get, stats, run, pause, stop, delete), prospects (list, search, add to campaign, delete), mailboxes (list, get) and reports (generate, get). Every mutation requires approval. Woodpecker publishes no OpenAPI document (its `llms.txt` lists none), so these are written by hand against the docs; some endpoints are still v1 (`campaign_list`, `prospects`, `add_prospects_campaign`) and the rest v2.

## Auth

- API key (`apiKey`): create a key in Woodpecker under Add-ons, API & Integrations, API keys, Create a key. It is sent in the `x-api-key` header. The REST API needs the API add-on on the subscription. The hosted MCP server does not accept API keys, so this method exposes only the REST tools. The "no API key" wording in Woodpecker's Claude docs applies to the MCP only.
- OAuth 2.0 (`oauth`): discovered from the MCP server (`login.woodpecker.co`, scope `woodpecker.mcp`, PKCE S256). There is no user-created OAuth app. The authorization server advertises client ID metadata documents and no dynamic registration endpoint. Per Executor's docs, Executor uses a client ID metadata document when the host publishes one (Executor Cloud does; self-hosting only if the operator enables it); otherwise the connect page asks for a client ID and secret, which Woodpecker does not issue, so on such hosts use the API key. Redirect URI is Executor's standard callback.

## Known gaps

- No real sign-in was done, so the OAuth tool list was not enumerated (see the [available tools](https://developers.woodpecker.co/docs/mcp/available-tools)).
- The REST tools omit campaign creation, step editing, Bounce Shield, Microsoft mailbox credentials and mailbox writes; use OAuth for those through the MCP.
- Woodpecker's v1 endpoints return 409 for rate limiting.
