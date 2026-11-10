import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.clay.com/openapi.json" },
  allowedOrigin: "https://api.clay.com",
  securitySchemes: { ClayApiKey: { type: "apiKey", in: "header", name: "clay-api-key" } },
  methods: { apiKey: [{ scheme: "ClayApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
