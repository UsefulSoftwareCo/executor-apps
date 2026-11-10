import type { OpenapiToolNamesOptions } from "apps/openapi";

// Mihu is hosted per workspace (<subdomain>.mihu.ai). index.ts swaps in the account's origin.
export const placeholderOrigin = "https://demo.mihu.ai";

export const options = {
  source: { url: "https://app.mihu.ai/docs/api-docs.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
