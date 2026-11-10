import type { OpenapiToolNamesOptions } from "apps/openapi";

// Guru's official OpenAPI 3.0 document. Every endpoint uses HTTP Basic auth: the username is the
// Guru user email (user token) or the collection ID (collection token), the password is the token.
export const options = {
  source: { url: "https://api.getguru.com/api/v1/openapi.json" },
  allowedOrigin: "https://api.getguru.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  fallbackSecurity: [{ basicAuth: [] }],
  methods: {
    apiToken: [
      { scheme: "basicAuth", field: "username", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "token", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
