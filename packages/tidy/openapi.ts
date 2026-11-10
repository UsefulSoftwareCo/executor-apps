import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.tidy.com/api/openapi.json" },
  allowedOrigin: "https://api.tidy.com",
  // The published document declares an X-API-Key header, but TIDY's authentication
  // guide specifies `Authorization: Bearer <api key>`, which is what we send.
  securitySchemes: { ApiKeyAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
