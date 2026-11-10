import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.unipile.com/v2/openapi.json" },
  allowedOrigin: "https://api.unipile.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-API-KEY" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
