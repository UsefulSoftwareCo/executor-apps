import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://app.enforcedflow.com/api-docs/openapi.yaml" },
  allowedOrigin: "https://app.enforcedflow.com",
  securitySchemes: { ProviderKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "ProviderKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
