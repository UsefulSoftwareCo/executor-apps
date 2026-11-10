# Layerre

Render images and PDFs from Canva-based design templates with [Layerre](https://layerre.com): import a Canva share link as a template, edit its text and image layers, and render single or bulk variants as PNG, JPEG, WebP or PDF. 16 tools.

## Interface

Custom tools written with `fetch` against the REST API documented at https://layerre.com/docs/ (base URL `https://api.layerre.com/v1`). Layerre publishes no OpenAPI document, only a Postman collection, and no MCP server, so the endpoints are hand-written (templates, layers, variants, analyze).

## Auth

- API key (`apiKey`): create one in the Layerre dashboard under API keys (`/app/api-keys`). It is sent as `Authorization: Bearer <key>`. The vendor docs describe no OAuth flow; only API keys are documented.

## Icon

The mark is the cloud mascot ("Larry", the vendor's "Cloud Mascot") cropped from the header wordmark file https://layerre.com/layerre-logo.svg, not a standalone mark; the vendor site publishes no standalone icon and its favicon.ico is a generic 16/32px favicon. The dark-theme variant keeps the dark face on the light cloud body and lightens the black outline so the mascot reads on dark tiles.

## Known gaps

- Request body schemas are collapsed in the vendor docs, so write tools take a free-form `body` object documented in each tool description.
- Rendering and importing consume plan credits; mutations require approval.
- Rate limit is 10 requests/second per IP (429 with `Retry-After`).
- `analyzeCanvaDesign` is a POST registered as a query (no approval prompt). The vendor docs say credits are consumed when generating an asset (image/PDF) and that a multi-page import counts as one render; they say nothing about credits for analyzing a Canva link, which generates no asset. Not confirmed with the vendor, so it is left as a query.
