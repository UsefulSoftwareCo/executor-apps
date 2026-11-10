import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.huntress.io/v1/swagger_doc.json" },
  allowedOrigin: "https://api.huntress.io",
  baseUrl: "https://api.huntress.io",
  // The spec defines the scheme as basic_auth but its security requirements name it "basic".
  securitySchemes: { basic: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "basic", field: "apiKey", part: "username", prefix: "" },
      { scheme: "basic", field: "apiSecret", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
