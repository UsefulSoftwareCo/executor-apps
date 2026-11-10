import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.perplexity.ai/openapi.json" },
  allowedOrigin: "https://api.perplexity.ai",
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "HTTPBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // createAgent also declares a text/event-stream response, which the generator drops silently; keep the JSON one (stream: false).
  patches: [{ op: "remove", path: "/paths/~1v1~1agent/post/responses/200/content/text~1event-stream" }],
} satisfies OpenapiToolNamesOptions;
