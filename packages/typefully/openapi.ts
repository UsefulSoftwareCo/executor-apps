import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.typefully.com/v2/openapi.json" },
  allowedOrigin: "https://api.typefully.com",
  securitySchemes: { PublicAPIAuthentication: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "PublicAPIAuthentication", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
