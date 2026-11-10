import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.meetcody.ai/source.json" },
  allowedOrigin: "https://getcody.ai",
  securitySchemes: { APIKey: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "APIKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
