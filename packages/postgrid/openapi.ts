import type { OpenapiToolNamesOptions } from "apps/openapi";

// Both security schemes in PostGrid's document are the same `X-API-Key` header.
export const options = {
  source: { url: "https://guides.postgrid.com/api/openapi.yaml" },
  allowedOrigin: "https://api.postgrid.com",
  securitySchemes: {
    AddressVerificationApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" },
    PrintMailApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" },
  },
  methods: {
    apiKey: [
      { scheme: "AddressVerificationApiKeyAuth", field: "token", part: "value", prefix: "" },
      { scheme: "PrintMailApiKeyAuth", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
