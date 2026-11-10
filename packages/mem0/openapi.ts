import type { OpenapiToolNamesOptions } from "apps/openapi";

// Mem0 expects `Authorization: Token <api key>`, so the scheme is rebound with a "Token " prefix.
export const options = {
  source: { url: "https://docs.mem0.ai/openapi.json" },
  allowedOrigin: "https://api.mem0.ai",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" },
    // The V3 operations reference `tokenAuth`, which the vendor spec never declares in components.securitySchemes.
    tokenAuth: { type: "apiKey", in: "header", name: "Authorization" },
  },
  methods: {
    apiKey: [
      { scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "Token " },
      { scheme: "tokenAuth", field: "token", part: "value", prefix: "Token " },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
