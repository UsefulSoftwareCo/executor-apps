import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.thelessonspace.com/v2/docs.json" },
  allowedOrigin: "https://api.thelessonspace.com",
  securitySchemes: { "API Key": { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "API Key", field: "token", part: "value", prefix: "Organisation " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
