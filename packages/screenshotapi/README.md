# Screenshot API

ScreenshotAPI (screenshotapi.net) renders web pages and custom HTML to PNG, JPG, WebP, PDF, or scrolling WebM/MP4/GIF, with optional HTML, text, Markdown and image-URL extraction, plus paid bulk capture jobs. 5 tools: `screenshots.render`, `bulk.createJsonJob`, `bulk.createCsvJob`, `bulk.status`, `bulk.download`.

Interface: hand-written tools over the documented REST API (https://www.screenshotapi.net/docs). Single renders call `https://shot.screenshotapi.net/v3/screenshot` with `output=json`, since raw image bytes cannot be returned through a tool; the result links to the stored file. Bulk jobs call `https://api.screenshotapi.net/v1/bulk/*`. ScreenshotAPI publishes no OpenAPI document and no MCP server.

Auth: API key only (no OAuth). Copy it from the dashboard at https://app.screenshotapi.net. It is sent as the `token` query parameter, as ScreenshotAPI requires, to `shot.screenshotapi.net` and `api.screenshotapi.net`. The vendor has no account endpoint, so the health check looks up a nonexistent bulk job, which is free and reports a wrong key as an authorization error.

Approvals: the render and bulk-create tools ask for approval because they consume credits. `bulk.status` and `bulk.download` are read-only.

Known gaps: render and bulk response shapes are not documented by the vendor and were not checked with live calls, so bulk responses are returned as received. Custom HTML is sent as a JSON POST body (the vendor recommends POST for it but documents no body format). Bulk is a paid-plan feature. Scheduled screenshots, cookie templates and storage integration setup are dashboard-only and not exposed.
