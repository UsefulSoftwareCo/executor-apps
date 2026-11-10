# Webpushr

Sends web push notifications through Webpushr to all subscribers, one subscriber, segments or custom attributes, and reads campaign status and subscriber counts.

**Interface:** custom tools written with `fetch` against the official REST API at `https://api.webpushr.com/v1`, documented at https://www.webpushr.com/docs/introduction-to-rest-api. Webpushr publishes no OpenAPI document and no official MCP server was found. 6 tools: four send endpoints, campaign status and subscriber count; every send requires approval.

**Auth:** API key. Webpushr authenticates each call with two headers, `webpushrKey` (REST API key) and `webpushrAuthToken` (authentication token). Both are on the Integration > API Keys page of the Webpushr web console and are tied to a single site, so add one account per site. Webpushr has no OAuth. The health check calls `POST /v1/authentication`, which only validates the pair.

**Known gaps:** the API has no segment or subscriber management endpoints, so segment IDs come from the dashboard. Webpushr returns non-standard HTTP codes (for example 404 for rate limiting) and string-typed counts. The icon is the vendor's official 180px apple-touch-icon (https://www.webpushr.com/apple-touch-icon.png), as no SVG is published.
