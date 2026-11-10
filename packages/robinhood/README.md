# Robinhood

Brokerage account, portfolio, quotes and trading in Robinhood, through Robinhood's official agent trading MCP server.

**Interface:** the official remote MCP server `https://agent.robinhood.com/mcp/trading`. Robinhood has no public REST API for equities that supports user OAuth apps, so the MCP server is the only official interface. Tools are discovered from the server at runtime (the list needs an authenticated session, so no count is published here). Every tool that is not marked read-only requires approval, which includes anything that places or cancels orders.

**Auth:** OAuth only. The server publishes protected-resource and authorization-server metadata (scope `internal`, PKCE S256) and supports dynamic client registration at `https://agent.robinhood.com/oauth/trading/register`, so Executor discovers everything from the URL and the redirect URI is registered automatically. The user signs in at robinhood.com. There is no API key method.

**Known gaps:** The tool list depends on the connected account and cannot be enumerated without credentials; the MCP probe only verified the OAuth challenge and metadata.

Icon: Robinhood from Simple Icons.
