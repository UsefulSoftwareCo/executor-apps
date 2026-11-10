import type { OpenapiToolNamesOptions } from "apps/openapi";

// Chargebee is hosted per site (<site>.chargebee.com, or <site>-test.chargebee.com for a test site). The document
// lists those as templated servers, so index.ts pins each account's own origin.
export const placeholderOrigin = "https://demo.chargebee.com";

export const options = {
  // Chargebee's official OpenAPI 3.1 document for API v2 with Product Catalog 2.0, published in chargebee/openapi.
  source: { url: "https://raw.githubusercontent.com/chargebee/openapi/main/spec/chargebee_api_v2_pc_v2_spec.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/v2`,
  securitySchemes: { BasicAuth: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "BasicAuth", field: "apiKey", part: "username", prefix: "" },
      // Chargebee authenticates with the API key as the Basic username and an empty password.
      { scheme: "BasicAuth", field: "basicPassword", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
