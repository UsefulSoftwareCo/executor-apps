import type { OpenapiToolNamesOptions } from "apps/openapi";

// Every operation requires both X-Api-Key and X-Api-Password.
export const options = {
  source: { url: "https://api-doc.copilot.clari.com/spec.yaml" },
  allowedOrigin: "https://rest-api.copilot.clari.com",
  securitySchemes: {
    api_key: { type: "apiKey", in: "header", name: "X-Api-Key" },
    api_password: { type: "apiKey", in: "header", name: "X-Api-Password" },
  },
  methods: {
    apiKey: [
      { scheme: "api_key", field: "apiKey", part: "value", prefix: "" },
      { scheme: "api_password", field: "apiPassword", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
