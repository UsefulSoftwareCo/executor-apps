import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.browserbase.com/reference/api/openapi.v1.yaml" },
  allowedOrigin: "https://api.browserbase.com",
  securitySchemes: { BrowserbaseAuth: { type: "apiKey", in: "header", name: "X-BB-API-Key" } },
  methods: { apiKey: [{ scheme: "BrowserbaseAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
