import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://app.loops.so/openapi.json" },
  allowedOrigin: "https://app.loops.so",
  securitySchemes: { apiKey: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
