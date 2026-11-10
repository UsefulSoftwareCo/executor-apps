import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.stream.estate/api-reference/openapi.json" },
  allowedOrigin: "https://api.stream.estate",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-API-KEY" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
