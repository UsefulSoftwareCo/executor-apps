import type { OpenapiToolNamesOptions } from "apps/openapi";

// Freepik's developer API is now branded Magnific; the vendor publishes this document from its docs site.
export const options = {
  source: { url: "https://storage.googleapis.com/fc-freepik-pro-rev1-eu-api-specs/magnific-api-v1-openapi.yaml" },
  allowedOrigin: "https://api.magnific.com",
  securitySchemes: { magnificApiKey: { type: "apiKey", in: "header", name: "x-magnific-api-key" } },
  methods: { apiKey: [{ scheme: "magnificApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
