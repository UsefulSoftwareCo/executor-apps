# WebCrawlerAPI

Crawl and scrape websites into LLM-ready markdown with [WebCrawlerAPI](https://webcrawlerapi.com): multi-page crawl jobs, single-page scrapes with structured output, the prompt-driven crawling agent, monitored feeds (change detection, RSS/JSON) and organization usage.

**Interface:** OpenAPI. The vendor's official Swagger 2.0 document at https://api.webcrawlerapi.com/swagger/doc.json (26 operations, 12 of them mutations), loaded live and converted by the framework. Mutations (starting crawls, scrapes, agent runs, creating or changing feeds, cancelling jobs) require approval.

**Auth:** API key. Create one in the [dashboard](https://dash.webcrawlerapi.com/) under "Access". It is sent as `Authorization: Bearer <key>`. WebCrawlerAPI has no OAuth.

**MCP:** the vendor's only MCP server ([WebCrawlerAPI/webcrawlerapi-mcp](https://github.com/WebCrawlerAPI/webcrawlerapi-mcp)) is a local stdio package (`npx webcrawler-mcp`) exposing a single scrape tool; there is no hosted remote MCP endpoint, so it is not mounted. The OpenAPI document covers far more.

**Agent endpoints:** the agent API (`/v1/agent`, `/v1/agent/jobs`, `/v1/agent/job/{id}`) is part of the main Swagger document above; no separate spec is mounted.

**Icon:** the vendor's own 192px PNG, https://webcrawlerapi.com/images/logo-icon.png (the vendor publishes no SVG).
