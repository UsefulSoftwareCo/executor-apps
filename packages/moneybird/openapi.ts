import type { OpenapiToolNamesOptions } from "apps/openapi";

// Moneybird's official OpenAPI document. Every operation accepts a bearer token,
// either a personal API token or an OAuth access token.
export const options = {
  source: { url: "https://raw.githubusercontent.com/moneybird/openapi/main/openapi.json" },
  allowedOrigin: "https://moneybird.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
