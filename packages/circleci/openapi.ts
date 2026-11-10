import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://circleci.com/api/v2/openapi.json" },
  allowedOrigin: "https://circleci.com",
  securitySchemes: { bearer_auth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer_auth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
