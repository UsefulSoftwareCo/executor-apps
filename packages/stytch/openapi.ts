import type { OpenapiToolNamesOptions } from "apps/openapi";

// Stytch's official OpenAPI 3.0 document. It lists the live and the test server; tools go to the
// live server only. Requests use HTTP Basic auth with the project ID as username and the secret
// as password.
export const options = {
  source: { url: "https://raw.githubusercontent.com/stytchauth/stytch-openapi/main/openapi.yml" },
  allowedOrigin: "https://api.stytch.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "project_id", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "secret", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
