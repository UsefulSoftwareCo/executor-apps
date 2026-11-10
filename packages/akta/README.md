# Akta

Akta (akta.pro, by Wokelo AI) is a private company intelligence API. This package covers company search and enrichment, entity-resolved news, headcount trends, job posts, social posts, website traffic, product and employee reviews, industry search, company-addition requests, and targeted company list generation.

**Interface:** OpenAPI 3.0, Akta's official document at https://docs.akta.pro/openapi.json (14 operations, server `https://api.akta.pro/api`). The official MCP server (`https://mcp.akta.pro/mcp`) is OAuth-gated and its tool list was not checked, so the OpenAPI document is used. The server only answers the canonical trailing-slash paths directly (the spec's non-slash paths get a same-origin 307 redirect).

**Auth:** API key only. Create one at https://playground.akta.pro/dashboard/manage/api-keys (sign up at https://playground.akta.pro/signup); the key is shown once and starts with `wk_`. It is sent in the `x-api-key` header.  Akta documents no OAuth flow for the API. The connection health check calls the free industry search endpoint, so it consumes no credits.

**Approvals:** the three POST operations (company addition requests, list generation, filter builder) require approval. Most read endpoints consume Akta credits; see https://docs.akta.pro/getting-started/pricing.

**Icon:** Akta publishes only a raster "akta.pro" wordmark (no SVG, and the akta.pro site blocks scripted access). The icon is a vector trace of the lowercase "a" of that official logo.