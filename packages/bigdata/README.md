# Bigdata.com

Grounded access to financial news, earnings transcripts, filings, entity intelligence and research workflows through Bigdata.com's official remote MCP server (the tool list is served by the server itself).

**Interface:** remote MCP, `https://mcp.bigdata.com/` (streamable HTTP). Docs: https://docs.bigdata.com/mcp-reference/api-integrations/mcp-api-integration. Tools come from the server; any tool without `readOnlyHint` requires approval. `scripts/mcp-probe.ts` shows the server answering 401 with OAuth protected-resource metadata (issuer `https://clerk.bigdata.com/`).

**Auth:** API key, sent as the `x-api-key` header, as the vendor documents. Create a key in the Bigdata.com Developer Platform under API Keys (https://platform.bigdata.com/api-keys).

**Known gaps:** OAuth is not offered. The vendor supports it only for official connectors (Claude, ChatGPT, Microsoft Copilot), and the authorization server does not advertise dynamic client registration, so a user cannot create an OAuth app for Executor. The server's optional `return-public-url` header (makes `bigdata_search` return public rather than app-login URLs) is not set. Bigdata.com is distinct from BigDataCloud (`bigdatacloud`), a geolocation API.
