import type { OpenapiToolNamesOptions } from "apps/openapi";

// Lodgify publishes no downloadable OpenAPI document (its ReadMe docs sit behind a
// Cloudflare challenge). This is the API Evangelist profile's copy of the public API.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/api-evangelist/lodgify/84518bae3be302ae0b3779e479d0d5c915c57a24/openapi/_original/lodgify-openapi.yml",
  },
  allowedOrigin: "https://api.lodgify.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-ApiKey" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
