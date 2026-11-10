import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.hostinger.com/openapi/openapi.json" },
  allowedOrigin: "https://developers.hostinger.com",
  securitySchemes: { apiToken: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "apiToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
