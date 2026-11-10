# SlidesGPT

Generate PowerPoint presentations with AI from a prompt, then fetch, download, embed or delete them.

Interface: the official SlidesGPT REST API, compiled from its OpenAPI document at https://slidesgpt.com/openapi.json (4 operations on `https://api.slidesgpt.com`). SlidesGPT also runs a keyless remote MCP server at https://mcp.slidesgpt.com/mcp with 2 tools; it is not mounted because the REST API covers presentation generation and adds management of existing decks.

Auth: API key (bearer token). Create one in the SlidesGPT dashboard under API settings (https://slidesgpt.com). The API offers no OAuth.

Known gaps: the API has no current-user endpoint, so the provider declares no health check. Generating a presentation consumes SlidesGPT credits.
