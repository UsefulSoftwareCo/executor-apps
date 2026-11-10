import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://app.bugbug.io/docs/schema/?version=v2" },
  baseUrl: "https://app.bugbug.io",
  allowedOrigin: "https://app.bugbug.io",
  securitySchemes: { tokenAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "tokenAuth", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
