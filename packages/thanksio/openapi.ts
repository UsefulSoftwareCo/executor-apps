import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/thanks-io/thanks.io-api-docs/cf71253abdec0d5aedc397c16d36aafd3657b243/api-reference/openapi.json",
  },
  allowedOrigin: "https://api.thanks.io",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
