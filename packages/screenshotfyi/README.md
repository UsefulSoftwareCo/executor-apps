# Screenshot.fyi

Screenshot.fyi takes screenshots of any website with one API call. This package exposes that call as one tool, `screenshots.take` (url, width, height, format, fullPage, darkMode, disableCookieBanners), which returns JSON whose `data.url` links to the hosted image. 1 tool.

Interface: hand-written tool over `GET https://screenshot.fyi/api/take`, as documented on the product page https://screenshot.fyi. Screenshot.fyi publishes no OpenAPI document and no MCP server.

Auth: API key only (no OAuth). Sign up at https://screenshot.fyi and copy the key from your dashboard. It is sent as the `accessKey` query parameter to `screenshot.fyi`, as the API requires.

Approvals: `screenshots.take` asks for approval because each call consumes plan quota.

Known gaps: the parameter list comes from the examples on the product page, as there is no separate API reference, and response shapes were not checked with live calls. The API has no free read-only endpoint, so the provider has no health check. The icon is the site's 180px app icon, as no SVG mark is published.
