import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://developers.podscribe.com/api/openapi.yaml" },
  allowedOrigin: "https://backend.podscribe.ai",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
