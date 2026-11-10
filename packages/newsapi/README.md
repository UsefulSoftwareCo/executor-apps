# NewsAPI

Search live and historical news articles, get breaking top headlines by country or category, and list the available publishers through NewsAPI.org. 3 read-only tools, so none need approval.

**Interface:** hand-written tools over `https://newsapi.org/v2`. NewsAPI.org publishes no OpenAPI document, MCP server or GraphQL API; the three endpoints (`/everything`, `/top-headlines`, `/top-headlines/sources`) are wrapped from the docs at https://newsapi.org/docs/endpoints.

**Auth:** API key, sent in the `X-Api-Key` header (the vendor also accepts an `apiKey` query parameter, which this package avoids so keys stay out of URLs). Get one at https://newsapi.org/register. No OAuth is offered.

**Known gaps:**
- Free Developer keys are limited to 100 requests per day, roughly one month of article history, and delayed results; the vendor's terms restrict them to development use.
- Parameters come from the vendor's docs; no live calls were made (no real credentials were used).
- The icon is the mark from the site's own `safari-pinned-tab.svg` (newsapi.org publishes no separate brand kit).
