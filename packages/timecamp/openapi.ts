import type { OpenapiToolNamesOptions } from "apps/openapi";

// TimeCamp's official OpenAPI 3.0 document. It lists a second server (v4.api.timecamp.com);
// every operation is served from the first, so only that origin is allowed.
export const options = {
  source: { url: "https://developer.timecamp.com/reference/dist/api-prod.yaml" },
  allowedOrigin: "https://app.timecamp.com",
  securitySchemes: { api_key_in_header: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "api_key_in_header", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
