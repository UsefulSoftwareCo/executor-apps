# HypeAuditor

HypeAuditor is an influencer analytics and marketing platform. This package covers its public REST API: Instagram, YouTube, TikTok, Twitter/X, Twitch and Snapchat reports, Instagram/TikTok/Twitter/Twitch metrics history, media and brand mentions, the keyword suggester, taxonomy, discovery search, creator profile info, unlocked reports, report lists and plan credits.

**Interface:** custom, hand-written tools over `https://hypeauditor.com/api/method/`. HypeAuditor publishes no downloadable OpenAPI document (its ReadMe docs embed per-page fragments that do not form a usable spec), GraphQL API or MCP server; the tools follow the official docs at https://hypeauditor.readme.io (index: https://hypeauditor.readme.io/llms.txt).

**Auth:** API key only (`apiKey`), made of a Client ID and an API token, sent as the `X-Auth-Id` and `X-Auth-Token` headers. HypeAuditor issues both on request (support@hypeauditor.com) and shows them in the account's API settings; the token changes when the account password changes. There is no OAuth. Health check calls `auditor.planInfo`. Mutations (adding or removing a report in a list) require approval.

**Notes:** reports are generated on demand and spend credits; HTTP 202 means the report is still building. Rate limit is under 100 requests per minute.

**Known gaps:** campaign management, media plan, market analysis, recruitment, report connections and PDF export APIs are not covered (their docs are partner-gated or not machine-describable). The icon is the flame mark extracted from HypeAuditor's official site logo SVG.
