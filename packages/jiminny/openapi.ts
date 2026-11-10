import type { OpenapiToolNamesOptions } from "apps/openapi";

// Jiminny is hosted per region (com, eu); index.ts swaps in the account's origin.
export const placeholderOrigin = "https://app.jiminny.com";

export const options = {
  source: { url: "https://jiminny.github.io/customer-api-docs/swagger.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/customer/api/v1`,
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
