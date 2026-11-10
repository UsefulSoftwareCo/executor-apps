import type { OpenapiToolNamesOptions } from "apps/openapi";

// NationBuilder's official V2 OpenAPI document (linked from https://nationbuilder.com/api/v2/reference).
// Its server is https://{subdomain}.nationbuilder.com; index.ts swaps in the account's own nation.
export const placeholderOrigin = "https://yournation.nationbuilder.com";

export const options = {
  source: { url: "https://nationbuilder.com/api/v2/docs/v2/released.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
