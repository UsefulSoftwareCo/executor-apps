import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://apidocs.tempo.io/tempo-openapi.yaml" },
  allowedOrigin: "https://api.tempo.io",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { token: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
