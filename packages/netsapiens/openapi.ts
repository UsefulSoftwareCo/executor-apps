import type { OpenapiToolNamesOptions } from "apps/openapi";

// NetSapiens' official API v2 OpenAPI 3.1 document, published on docs.ns-api.com (listed in its
// /.well-known/api-catalog). Its server is the templated https://{server}/ns-api/v2, so index.ts pins each
// account's own platform host.
export const placeholderOrigin = "https://ns-api.com";

export const options = {
  source: { url: "https://docs.ns-api.com/openapi/netsapiens-api-v2.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/ns-api/v2`,
  // The document declares two identical bearer schemes; API keys and access tokens both go in the Bearer header.
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" }, bearer: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [
      { scheme: "bearerAuth", field: "apiKey", part: "value", prefix: "" },
      { scheme: "bearer", field: "apiKey", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
