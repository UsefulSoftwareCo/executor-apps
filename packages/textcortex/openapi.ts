import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.textcortex.com/v1/openapi.json" },
  allowedOrigin: "https://api.textcortex.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Chat completions and responses also declare a text/event-stream 200 response. The compiler
  // cannot run a stream as a single-result tool and drops such operations, so the stream variant
  // is removed and the JSON variant is exposed (callers must not set `stream: true`).
  patches: [
    { op: "remove", path: "/paths/~1chat~1completions/post/responses/200/content/text~1event-stream" },
    { op: "remove", path: "/paths/~1responses/post/responses/200/content/text~1event-stream" },
  ],
} satisfies OpenapiToolNamesOptions;
