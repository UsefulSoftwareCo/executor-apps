# Linguin AI

Language detection and English profanity scoring from Linguin AI: `detectLanguage`, `detectLanguages` (bulk), `checkProfanity`, `checkProfanityBatch`, `getAccountStatus` and `listSupportedLanguages`.

**Interface:** hand-written tools over Linguin's official v2 REST API, documented at https://linguin.ai/api-docs/v2/. Linguin publishes no OpenAPI document and no remote MCP server. Endpoints: `POST https://api.linguin.ai/v2/detect/language`, `/v2/bulk_detect/language`, `/v2/detect/profanity`, `/v2/bulk_detect/profanity` (JSON body `{ "q": text | [texts] }`), `GET /v2/status` and `GET /v2/languages` (the latter needs no key). The detection endpoints are POSTs but only analyse text, so they are exposed as read-only tools without approval.

**Auth:** API key only; Linguin has no OAuth. Get a key at https://linguin.ai (free accounts get 100 detections per day). It is sent as `Authorization: Bearer <key>` to `api.linguin.ai` only. The health check calls `GET /v2/status`, which does not use quota.

**Notes:** billing counts detections, not calls, so a bulk call with N texts uses N detections and fails atomically (HTTP 429) if the quota cannot cover all of them. Profanity scoring works on English text only.

**Known gaps:** none; all six documented endpoints are exposed.

**Icon:** the official Linguin penguin app icon (192px PNG) from https://linguin.ai/android-icon-192x192.png.
