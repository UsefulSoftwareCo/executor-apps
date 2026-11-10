# fal.ai

Run generative media models on fal.ai and manage the account around them: submit, poll, fetch and cancel queue requests against any model endpoint (image, video, audio), search models, estimate pricing, read usage and analytics, and manage API keys, assets, compute and serverless apps.

Interface: two official OpenAPI documents, mounted as `platform` and `queue`.

- `platform`: the Platform API, https://fal.ai/docs/api-reference/platform-apis/openapi/v1.json (server `https://api.fal.ai/v1`).
- `queue`: the Queue API, https://fal.ai/api/openapi/queue/openapi.json (server `https://queue.fal.run`). The model input goes in the request body of the submit tool, whose schema is generic; use platform model search to find each endpoint's schema.

Auth: API key (`apiKey`). Create one at https://fal.ai/dashboard/keys. The key is sent as `Authorization: Key <key>`. Platform operations need a key whose permission preset covers them (for example `API`, `READONLY`, `BILLING`, `COMPUTE`, `SERVERLESS`, `FULL`); fal answers 403 otherwise. fal offers no user-created OAuth apps. Its hosted MCP server (https://mcp.fal.ai/mcp) uses OAuth with dynamic registration but exposes far less than these two APIs, so it is not used.

The queue document declares `endpoint_id` as a plain path parameter, which the runtime would send percent-encoded (`fal-ai%2Fflux%2Fdev`), but fal expects raw slashes (`queue.fal.run/fal-ai/flux/dev`). `openapi.ts` patches the document to mark it `allowReserved` and to name the four operations `queueSubmit`, `queueStatus`, `queueResult` and `queueCancel` (the document has no operationIds). The wire URL was checked against the bundled swagger client: unpatched gives `/fal-ai%2Fflux%2Fdev`, patched gives `/fal-ai/flux/dev`.

Totals: 87 platform tools (38 mutations) plus 4 queue tools (2 mutations), 91 in all. The platform document has 88 operations; `POST /serverless/logs/stream` (`serverlessLogsStream`, Server-Sent Events) is dropped silently by the compiler and not counted as skipped.

Server note: integrations.sh lists the platform API as `https://rest.alpha.fal.ai`; the official spec's server `https://api.fal.ai/v1` is used instead.

Icon: fal publishes no press or brand page (`/brand` and `/press` return 404), so the mark is the SVG favicon of fal.ai, which is the product's vector mark.

Known gaps: the SSE logs stream (`POST /serverless/logs/stream`) and the queue status stream (`/status/stream`) are not exposed; synchronous `fal.run` calls and webhooks-style delivery are not exposed; use the queue. Mutations require approval.
