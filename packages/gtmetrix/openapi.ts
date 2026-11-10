import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://gtmetrix.com/api/gtmetrix-openapi-v2.0.json" },
  allowedOrigin: "https://gtmetrix.com",
  securitySchemes: { api_key: { type: "http", scheme: "basic" } },
  // The API key is the Basic username; the password stays empty.
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "username", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
