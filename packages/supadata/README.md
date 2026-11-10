# Supadata

Supadata turns videos and websites into text. This package covers transcripts
(YouTube, TikTok, Instagram, X, Facebook, file URLs), social metadata, AI
structured-data extraction, YouTube search/channel/playlist/video data and
batches, web scrape/map/crawl, and account credit usage.

**Interface:** OpenAPI, Supadata's official v1 document at
https://docs.supadata.ai/api-reference/v1-openapi.json (21 operations). The
official hosted MCP server (https://api.supadata.ai/mcp, OAuth) exposes only 9
tools, so the OpenAPI document was preferred.

**Auth:** API key (`x-api-key`). Create one in the Supadata dashboard at
https://dash.supadata.ai/. Supadata offers no user-created OAuth apps for the
REST API (OAuth is only for its MCP server), so no `oauth2` method is declared.

**Icon:** Supadata's official 512px app icon (https://supadata.ai/apple-icon.png);
the vendor publishes only a wordmark as SVG.

**Gaps:** Calls spend Supadata credits (AI transcripts cost 2 credits/minute).
Async jobs (transcript, extract, crawl, batch) return a job id that you poll
with the matching result tool.
