import type { OpenapiToolNamesOptions } from "apps/openapi";

// SuiteDash serves its Secure API description (OpenAPI 3.0.3) unauthenticated from its live docs page.
// Every operation requires both the Public ID and a Secret Key as headers.
export const options = {
  source: { url: "https://app.suitedash.com/secure-api/swagger/json-file" },
  allowedOrigin: "https://app.suitedash.com",
  baseUrl: "https://app.suitedash.com/secure-api",
  securitySchemes: {
    "Public-ID": { type: "apiKey", in: "header", name: "X-Public-ID" },
    "Secret-Key": { type: "apiKey", in: "header", name: "X-Secret-Key" },
  },
  methods: {
    apiKey: [
      { scheme: "Public-ID", field: "publicId", part: "value", prefix: "" },
      { scheme: "Secret-Key", field: "secretKey", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
