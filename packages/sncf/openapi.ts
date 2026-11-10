import type { OpenapiToolNamesOptions } from "apps/openapi";

// SNCF's API is Navitia served at api.sncf.com; its schema is Swagger 2.0.
// The token is the Basic auth username; the password stays empty.
export const options = {
  source: { url: "https://api.sncf.com/v1/schema" },
  baseUrl: "https://api.sncf.com/v1",
  allowedOrigin: "https://api.sncf.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  methods: { apiKey: [{ scheme: "basicAuth", field: "token", part: "username", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
