import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://apis.botstar.com/docs/public-api.yaml" },
  allowedOrigin: "https://apis.botstar.com",
  // The published document lists the staging server; tools go to production, as the docs page does.
  baseUrl: "https://apis.botstar.com/v1",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
