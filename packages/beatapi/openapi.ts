import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://beatapi.io/openapi.json" },
  allowedOrigin: "https://api.beatapi.io",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
