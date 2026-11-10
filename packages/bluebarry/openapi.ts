import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://data.bluebarry.ai/docs/api.json" },
  allowedOrigin: "https://data.bluebarry.ai",
  securitySchemes: { ApiKey: { type: "apiKey", name: "Authorization", in: "header" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ ApiKey: [] }],
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
