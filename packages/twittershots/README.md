# TwitterShots

Render public X (Twitter) posts as screenshots (SVG, PNG or HTML), fetch posts as Markdown (single or up to 100 in bulk), and check remaining API credits.

**Interface:** hand-written tools over the official REST API at https://api.twittershots.com ([docs](https://twittershots.com/docs/api), [content docs](https://twittershots.com/docs/api/content)). The vendor's own OpenAPI document (https://twittershots.com/openapi.yaml) covers only the screenshot and usage endpoints with three screenshot parameters, and omits the content API, so the tools are written by hand: `usage`, `screenshot`, `content.get`, `content.bulk` (4 tools). `screenshot` always sets `returnType=url` because tool results cannot carry image bytes; the hosted URL is temporary. Screenshot and content calls use API credits (the bulk cost per id is not documented) and always ask for approval.

**Auth:** API key (sent as the `X-API-KEY` header). Create one in your account at https://twittershots.com/settings/keys. The vendor has no user-created OAuth apps.

**Gaps:** The official remote MCP server (https://mcp.twittershots.com/mcp, OAuth) exposes only three tools (authorization status, usage, one PNG screenshot) and is not mounted. Thread, bulk-image, video and logo-branding features are web-app only. `width` (300-1000 px, default 410) and `height` (`auto` or a pixel value) are verified against the vendor screenshot docs. The bulk content endpoint is documented with only `tweetIds`, so the `include*` options are exposed on single `content.get` only. The icon is the official `logo.png` (240px) from twittershots.com; the vendor publishes no SVG.
