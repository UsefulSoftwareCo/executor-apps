import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://beachdayapi.com/en/openapi.json" },
  allowedOrigin: "https://beachdayapi.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
