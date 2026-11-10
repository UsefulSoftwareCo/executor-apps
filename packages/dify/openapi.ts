import type { OpenapiToolNamesOptions } from "apps/openapi";

// The compiler silently drops operations whose 200 response offers text/event-stream. Dify's run
// endpoints also answer application/json (response_mode "blocking"), so that alternative is
// removed; the two stream-only endpoints are exposed as plain text (the buffered event stream).
const textStream = { "text/plain": { schema: { type: "string" } } };

// Dify's published Service API description; its server is templated (api.dify.ai/v1 by default).
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/langgenius/dify-docs/main/en/api-reference/openapi_service.json",
  },
  baseUrl: "https://api.dify.ai/v1",
  allowedOrigin: "https://api.dify.ai",
  securitySchemes: { ApiKeyAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: [
    { op: "remove" as const, path: "/paths/~1chat-messages/post/responses/200/content/text~1event-stream" },
    { op: "remove" as const, path: "/paths/~1completion-messages/post/responses/200/content/text~1event-stream" },
    { op: "remove" as const, path: "/paths/~1datasets~1{dataset_id}~1pipeline~1run/post/responses/200/content/text~1event-stream" },
    { op: "remove" as const, path: "/paths/~1workflows~1run/post/responses/200/content/text~1event-stream" },
    { op: "remove" as const, path: "/paths/~1workflows~1{workflow_id}~1run/post/responses/200/content/text~1event-stream" },
    { op: "replace" as const, path: "/paths/~1datasets~1{dataset_id}~1pipeline~1datasource~1nodes~1{node_id}~1run/post/responses/200/content", value: textStream },
    { op: "replace" as const, path: "/paths/~1workflow~1{workflow_run_id}~1events/get/responses/200/content", value: textStream },
  ],
} satisfies OpenapiToolNamesOptions;
