import type { OpenapiToolNamesOptions } from "apps/openapi";

// RepairShopr is hosted per account (<subdomain>.repairshopr.com). index.ts swaps in the account's origin.
export const placeholderOrigin = "https://your-subdomain.repairshopr.com";

export const options = {
  source: { url: "https://api-docs.repairshopr.com/swagger.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/v1`,
  securitySchemes: {
    bearerAuth: { type: "http", scheme: "bearer" },
    // Only GET /callerid requires this scheme; the other 186 operations require bearerAuth.
    apiKey: { type: "apiKey", in: "query", name: "api_key" },
  },
  methods: {
    apiKey: [
      { scheme: "bearerAuth", field: "apiKey", part: "value", prefix: "" },
      { scheme: "apiKey", field: "apiKey", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
