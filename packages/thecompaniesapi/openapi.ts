import type { OpenapiToolNamesOptions } from "apps/openapi";

// The API takes the raw token after a literal "Basic " in the Authorization header.
export const options = {
  source: { url: "https://api.thecompaniesapi.com/v2/openapi" },
  allowedOrigin: "https://api.thecompaniesapi.com",
  securitySchemes: {
    apiKey: { type: "apiKey", name: "Authorization", in: "header" },
  },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "Basic " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
