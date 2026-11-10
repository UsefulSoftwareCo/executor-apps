import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.markup.ai/openapi.json" },
  allowedOrigin: "https://api.markup.ai",
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "HTTPBearer", field: "token", part: "value", prefix: "" }] },
  // The stream endpoint is Server-Sent Events but the spec declares application/json, so it would be
  // exposed as an ordinary tool that cannot consume an event stream. Poll the workflow status tools instead.
  patches: [{ op: "remove", path: "/paths/~1agents~1workflows~1{workflow_id}~1stream" }],
  oauth: [],
} satisfies OpenapiToolNamesOptions;
