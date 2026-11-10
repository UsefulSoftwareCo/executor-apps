# Ordinal

Collaborative social media planning in Ordinal: posts and ideas for LinkedIn, X, Instagram, TikTok and YouTube Shorts, media uploads, approvals, subscribers, comments, team engagements, Slack boosts and analytics.

**Interface:** Ordinal's official remote MCP server, `https://app.tryordinal.com/mcp` (documented at https://docs.tryordinal.com/mcp/tools). Tools are discovered from the server at runtime. Mutating tools require approval; tools with `readOnlyHint` do not.

**Auth:** OAuth 2.0 only. The server publishes OAuth metadata (Supabase authorization server) and supports dynamic client registration, so the user just signs in with their browser; there is no OAuth app to create and no redirect URI to register by hand. Requires an Ordinal Pro plan or higher.

**Known gaps:** Ordinal also has a REST API with API keys (`https://app.tryordinal.com/api/v1`, Bearer `ord_...`), but its OpenAPI document is not public (the one at docs.tryordinal.com/openapi.json only describes the docs site), so API-key auth is not offered. Start a session by listing workspaces (`ordinal_get_workspace_context`).

## Icon

`icon.ts` is generated from Ordinal's own vector mark, served at https://docs.tryordinal.com/favicon.svg, with the dark rounded tile removed. The file is a 32x32 viewBox SVG, so it scales without loss; Ordinal publishes no separate logo SVG or press kit. The only other copy is a 180px raster apple-icon on a solid tile, which cannot be cleanly de-tiled, so the vector is used instead.
