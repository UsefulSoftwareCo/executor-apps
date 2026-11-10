# HeyReach

Automate LinkedIn outreach with HeyReach: campaigns (create, start, pause, sequences, schedules), lead lists, leads and tags, LinkedIn accounts, inbox conversations, analytics, blacklists, webhooks and organization management.

## Interface

OpenAPI. The source is HeyReach's own published document, https://docs.heyreach.io/openapi.json (87 paths, 88 operations). That document is a Fern export with a placeholder server (`https://api`), a doubled leading slash on every path, example query strings baked into some paths and no security scheme, so `openapi.ts` embeds a corrected copy: server `https://api.heyreach.io`, normalized paths, and the `X-API-KEY` header declared as the security scheme. Six query parameters the vendor document describes as "(Required)" but marks optional (accountId, listId and campaignId on li_account/GetById, list/GetById, campaign/GetById, campaign/Resume, campaign/StartCampaign, campaign/GetCampaignSequence) are corrected to required. Operations are otherwise unchanged. HeyReach's docs MCP server (https://docs.heyreach.io/_mcp/server) only serves documentation, not the API.

## Auth

API key. Use a HeyReach workspace API key (the vendor documents no UI menu path; keys are created through the Workspace API Keys endpoints of its management API). It is sent in the `X-API-KEY` header to `api.heyreach.io`. HeyReach offers no OAuth for third-party apps. The health check calls `GET /api/public/auth/CheckApiKey`; the vendor leaves the success response undocumented, so treating HTTP 200 as valid is an inference (an invalid key returns 401). integrations.sh has no HeyReach entry.

## Known gaps

- Spec response schemas contain machine-generated property names from the vendor's export; request shapes are what matter.
- Mutations (including starting campaigns and adding leads) require approval.
