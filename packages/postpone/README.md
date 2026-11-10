# Postpone

Social media scheduling and analytics for Reddit, X, Instagram, Facebook, TikTok, YouTube, LinkedIn, Pinterest, Mastodon, Bluesky, Threads and Tumblr: posts, submissions, media library, campaigns, tags, schedules and analytics.

**Interface:** GraphQL, the vendor's primary API, at `https://api.postpone.app/gql` (docs: https://developers.postpone.app). The schema is introspected live, so every query and mutation becomes a tool (153 at the time of writing). Mutations require approval.

**Auth:** API key. Postpone sends it as `Authorization: Bearer <key>`. Create the key in your Postpone account settings (see https://developers.postpone.app/getting-started). The GraphQL API has no OAuth method.

**MCP and OAuth:** Postpone also runs a remote MCP server (Beta) at `https://api.postpone.app/mcp` (streamable HTTP, docs: https://developers.postpone.app/getting-started/ai-mcp). It accepts OAuth 2.1 (scopes `posts:read`, `posts:write`, `accounts:read`, `media:read`, `analytics:read`; RFC 8414 metadata and dynamic client registration at `https://api.postpone.app`) and the same Bearer API key. It exposes only 6 tools (list social accounts, list scheduled and published posts, create post, delete scheduled posts, search media), so this package uses the 153-tool GraphQL API instead and is not mounted on the MCP endpoint. OAuth is therefore available only on the MCP endpoint, not in this package.

**Icon:** Postpone publishes no SVG logo kit or press page. The icon is the 180px app icon (`https://www.postpone.app/images/apple-touch-icon.png`, the site's apple-touch-icon), not the 32px favicon. It shows the blue Postpone mark and is legible on light and dark tiles.

**Health check:** `profile { id username }` is decoded as non-null strings; both fields are `NON_NULL` in the introspected schema. An invalid key returns `profile: null`, which surfaces as a decode failure.
