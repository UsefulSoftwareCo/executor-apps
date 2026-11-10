import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://hjarni.com/openapi.json" },
  allowedOrigin: "https://hjarni.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
