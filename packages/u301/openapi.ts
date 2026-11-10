import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.u301.com/api-reference/openapi.json" },
  allowedOrigin: "https://api.u301.com",
  // /qrcode references an undeclared scheme named "bearer"; declare it so the operation is kept.
  securitySchemes: {
    bearerAuth: { type: "http", scheme: "bearer" },
    bearer: { type: "http", scheme: "bearer" },
  },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ bearer: [], bearerAuth: [] }],
  methods: {
    apiKey: [
      { scheme: "bearerAuth", field: "token", part: "value", prefix: "" },
      { scheme: "bearer", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
