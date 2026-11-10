import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://openphone-public-api-prod.s3.us-west-2.amazonaws.com/public/openphone-public-api-2026-03-30-prod.json" },
  allowedOrigin: "https://api.quo.com",
  securitySchemes: {
    apiKey: { type: "apiKey", name: "Authorization", in: "header" },
    // The spec's GET /phone-numbers/available names bearerAuth without defining it; the API takes the same raw key.
    bearerAuth: { type: "apiKey", name: "Authorization", in: "header" },
  },
  methods: {
    apiKey: [
      { scheme: "apiKey", field: "token", part: "value", prefix: "" },
      { scheme: "bearerAuth", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
