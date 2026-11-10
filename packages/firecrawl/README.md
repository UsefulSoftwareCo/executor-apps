# Firecrawl

Web scraping and data extraction for agents: scrape, crawl, map and search the web, batch scrape, extract structured data, run Firecrawl agents and interactive browser sessions, manage monitors, and read team credit and token usage.

**Interface:** OpenAPI. Firecrawl's official v2 API document, https://docs.firecrawl.dev/api-reference/v2-openapi.json, served against https://api.firecrawl.dev/v2. Tools are generated live from it. Every mutation (POST, PUT, DELETE) asks for approval.

**Auth:** API key. Create one in the Firecrawl dashboard at https://www.firecrawl.dev/app/api-keys (linked from the docs' introduction); it is sent as a bearer token. Firecrawl does publish OAuth metadata (https://www.firecrawl.dev/.well-known/oauth-authorization-server and /.well-known/oauth-protected-resource: public client, PKCE S256, dynamic client registration at /api/oauth/register, scopes firecrawl:global and offline_access, resource https://api.firecrawl.dev/), but OAuth is withheld: its auth.md page does not describe a standard OAuth flow, the other sources list only API keys, and it could not be verified here that an issued fco_ token works against api.firecrawl.dev/v2 or that Executor's connect flow can obtain a dynamically registered client. Revisit once that can be tested end to end.

**Icon:** the flame mark from Firecrawl's official brand kit (https://www.firecrawl.dev/brand).

**Known gaps:** Firecrawl also publishes an MCP server and CLI; they are not used because the OpenAPI document covers the API. Scrapes and crawls spend Firecrawl credits.
