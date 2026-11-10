import type { OpenapiToolNamesOptions } from "apps/openapi";

// APILayer's official Marketstack v2 document, published on SwaggerHub under the APILayer
// organisation (owner apilayer-863, which also publishes Aviationstack, Coinlayer, Currencylayer...).
export const options = {
  source: { url: "https://api.swaggerhub.com/apis/apilayer-863/MarketstackAPIv2/2.0.0/swagger.json" },
  allowedOrigin: "https://api.marketstack.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "query", name: "access_key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
