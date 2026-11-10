# Smartlead

Cold email outreach with [Smartlead](https://www.smartlead.ai): campaigns and sequences, leads and lead lists, sending email accounts and warmup, the master inbox, analytics and campaign statistics, webhooks, Smart Delivery placement tests, Smart Senders and agency client management.

## Interface

OpenAPI. Smartlead's docs (https://api.smartlead.ai) are Mintlify-hosted and the spec served at `https://api.smartlead.ai/api-reference/openapi.json` is only a placeholder (two "plants" paths). The package therefore uses the full OpenAPI 3.1 document for `https://server.smartlead.ai/api` (98 operations) published by API Evangelist at https://github.com/api-evangelist/smartlead-ai, pinned to a commit. This is a community-maintained spec, not one hosted by Smartlead. Every mutation requires approval.

## Auth

API key. Create or copy it in the Smartlead dashboard under Settings > API Key Management and paste it as the API key. It is sent as the `api_key` query parameter to `server.smartlead.ai`, as Smartlead documents. Smartlead has no user-created OAuth apps.

## Known gaps

- The spec is community-maintained and may lag the live API. 96 operations declare `api_key` as a query parameter; `api-key-patches.json` removes it so the account key is injected rather than passed as tool input.
- The spec also lists a staging server; only production (`server.smartlead.ai`) is used.
- Smartlead's own documentation MCP server (`https://api.smartlead.ai/mcp`) only searches docs and runs no API calls, so it is not used.
- Some read-only POST endpoints are approval-gated because they are mutations by HTTP method.
- Method and route check: the methods and paths in the community spec were compared with the `curl` examples on Smartlead's per-endpoint reference pages (api.smartlead.ai/api-reference/...), and they agree: update campaign status and settings, update email account and update lead use POST, update webhook uses PUT, and webhooks live under `/v1/webhook/...`. Smartlead's `llms.txt` summary lists the same operations as PATCH on shorter routes (for example `PATCH /webhooks/{id}`, `POST /webhooks`, `PATCH /campaigns/{id}/leads/{lead_id}/status`); that summary disagrees with the reference pages and is not followed. Neither source was exercised against the live API with a real key, so if a call returns 404 or 405, the verb or route may have changed.
- The reference lists more endpoints (about 240) than the 98 in the community spec, so some newer endpoints (for example SmartProspect and diagnostics) are not available here.
- Official MCP not used: Smartlead documents an MCP server at `https://mcp.smartlead.ai/sse?user_api_key=YOUR_API_KEY` (170 tools). It uses the legacy SSE transport with the API key in the URL query rather than a header, it accepts connections and lists tools without any credentials (so Executor cannot verify an account against it), and its tools carry no read-only or destructive annotations, so approvals would have to be guessed for 170 tools. `https://server.smartlead.ai/mcp` is not an MCP server; every unknown path there answers 401. Revisit if Smartlead adds header authentication to the MCP.
- `utilities.trackEmailOpen` is a GET tracking pixel that records an email open, so it is approval-gated like the mutations.
- The icon is Smartlead's official 512px site icon (PNG).
