import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.botdog.co/openapi.json" },
  allowedOrigin: "https://api.botdog.co",
  securitySchemes: { "api-key": { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "api-key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
