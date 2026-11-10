import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official OpenAPI 3.1 document published with the developer docs at https://developer.swoogo.com.
// Every operation names `bearerAuth`; the token comes from the OAuth 2 client-credentials exchange.
export const options = {
  source: { url: "https://developer.swoogo.com/api-reference/openapi.yaml" },
  allowedOrigin: "https://api.swoogo.com",
  baseUrl: "https://api.swoogo.com/api/v1",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
