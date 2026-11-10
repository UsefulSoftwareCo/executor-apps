# Jev

Jev is TypeSafe AI's System One model. It reads a text or JSON `state` and answers typed questions with probabilities: Noul (yes/no probability), Choice (one of up to 255 labelled options) and Score (a position on a 2 to 10 level scale), each Choice and Score with a confidence value. This package exposes two tools: `evaluate` (`POST /v1/systemone`, a read-only evaluation, so no approval is required) and `listModels` (`GET /v1/models`).

**Interface:** hand-written tools over the documented HTTP API at `https://api.typesafe.ai/v1` (docs: https://docs.typesafe.ai/api). TypeSafe publishes no OpenAPI document and no remote MCP server. It has only these two endpoints.

**Auth:** API key. Create one in the TypeSafe console at https://console.typesafe.ai/keys. It is sent as `Authorization: Bearer <key>`. There is no OAuth.

**Icon:** the TypeSafe mark, from the 192px app icon on the vendor's docs site (https://docs.typesafe.ai). Jev is TypeSafe's own model and has no separate mark; Simple Icons has neither.

**Known gaps:** the health check calls `GET /v1/models`, an endpoint known from the vendor's SDK reference but not described on the API reference page, so its response is not decoded beyond requiring a 2xx. Jev accepts text only and is in early access with dynamic rate limits (429 and 529 are returned when over limit; retry with backoff).
