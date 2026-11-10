import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://v2.convertapi.com/info/openapi" },
  allowedOrigin: "https://v2.convertapi.com",
  securitySchemes: {
    secret: { type: "http", scheme: "bearer" },
    token: { type: "http", scheme: "bearer" },
    jwt: { type: "http", scheme: "bearer" },
  },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ jwt: [], token: [] }, { secret: [] }] as Record<string, string[]>[],
  methods: {
    apiKey: [
      { scheme: "token", field: "token", part: "value", prefix: "" },
      { scheme: "jwt", field: "token", part: "value", prefix: "" },
    ],
    masterToken: [{ scheme: "secret", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
