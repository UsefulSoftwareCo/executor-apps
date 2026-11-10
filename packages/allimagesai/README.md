# All Images AI

Search, buy and download images on All-Images.ai, create and manage AI image generations (prints), subscribe webhooks and check account credits.

**Interface:** OpenAPI, generated live from the vendor's own document at https://api.all-images.ai/doc-json (docs: https://developer.all-images.ai). The document declares a bearer scheme and no per-operation security, but every operation takes the key in a required `api-key` header parameter, so `openapi.ts` overrides the scheme, drops that parameter from each operation and injects the account's key through a fallback security requirement (the key is never a model-supplied input). Mutations require approval.

**Auth:** API key only. Create and manage personal access tokens at https://app.all-images.ai/en/api-keys; they are sent in the `api-key` header (see https://developer.all-images.ai/all-images.ai-api/authentication). The vendor offers no OAuth. Health check calls `GET /v1/api-keys/check`.

**Known gaps:** the `GET /v1/images/{format}/{imageId}.jpg` display endpoint returns image bytes and may not be useful as a tool. The vendor spells one path `/v1/images/downladed`; it is kept as published. The spec lists 16 operations; 15 are exposed. `GET /v1/api-keys/webhook/{apiKeyWebhookId}` is deliberately omitted: the vendor echoes the live API key in its `apiKeyId` response field (undocumented in the spec), so exposing it would copy the user's key into model context and tool logs. `POST /v1/images/search` and `POST /v1/images/downladed` are read-only in intent but are POSTs, so they are approval-gated.
