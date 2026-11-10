import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.parseur.com/openapi.json" },
  baseUrl: "https://api.parseur.com",
  allowedOrigin: "https://api.parseur.com",
  securitySchemes: { TokenAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "TokenAuth", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
