import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://openapi-prod-openapidocumentationbucketprodf3f6f37-23pq5ujpblj3.s3.eu-west-1.amazonaws.com/1.16.0/oas.json" },
  allowedOrigin: "https://api.rentman.net",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
