# Curated

Tools for [Curated](https://curated.co) newsletters: publications, categories, issues (list, get, create and delete drafts), collected links (list, get, create, update, delete) and email subscribers and unsubscribers (16 tools).

**Interface:** hand-written tools over Curated's official REST API v3 (`https://api.curated.co/api/v3`), documented at https://support.curated.co/help/getting-started-with-the-api. Curated publishes no OpenAPI document, MCP server or GraphQL API, so the tools follow the six help-center API articles.

**Auth:** API key only. Curated has no OAuth. Sign in at https://my.curated.co, open Account, and copy the "Account API key". It is sent as `Authorization: Token token="<key>"`.

**Known gaps:** the API cannot publish or edit issues, and only links (not text items) can be collected. Link create/update send their fields as query-string parameters, as the docs specify. Response shapes for subscribers and links are undocumented, so those tools return the raw JSON.

**Icon:** the orange "@" mark from curated.co (vendor SVG).
