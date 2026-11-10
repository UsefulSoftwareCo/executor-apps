import type { OpenapiToolNamesOptions } from "apps/openapi";

// Shippo's own OpenAPI document. API tokens go in `Authorization: ShippoToken <token>`;
// OAuth access tokens are sent as a Bearer token.
export const options = {
  source: { url: "https://docs.goshippo.com/spec/shippoapi/public-api.yaml" },
  allowedOrigin: "https://api.goshippo.com",
  securitySchemes: {
    APIKeyHeader: { type: "apiKey", in: "header", name: "Authorization" },
  },
  methods: {
    apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "ShippoToken " }],
    oauth: [{ scheme: "APIKeyHeader", field: "access_token", part: "value", prefix: "Bearer " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
