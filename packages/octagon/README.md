# Octagon

Public- and private-market intelligence from Octagon AI: SEC filings, earnings call transcripts, financial metrics and ratios, stock data, deep research and prediction-market analysis.

**Interface:** Octagon's official remote MCP server, `https://mcp.octagonai.co/mcp` (docs: https://octagonai.co/docs/guide/mcp-server). Tools are discovered from the server at runtime. Non-read-only tools require approval.

**Auth:** OAuth 2.0 with dynamic client registration; the server publishes its metadata (issuer `https://login.octagonai.co`), so there is no OAuth app to create. Sign in with your Octagon account when connecting. Octagon also supports API keys placed in the URL path (`/{OCTAGON_API_KEY}/mcp`); that is not used here because it would put the credential in the URL.

**Known gaps:** the tool list depends on what the server exposes to your account.
