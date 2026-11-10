import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.gladia.io/openapi.json" },
  allowedOrigin: "https://api.gladia.io",
  securitySchemes: {
    x_gladia_key: { type: "apiKey", name: "x-gladia-key", in: "header" },
  },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ x_gladia_key: [] }],
  methods: { apiKey: [{ scheme: "x_gladia_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
