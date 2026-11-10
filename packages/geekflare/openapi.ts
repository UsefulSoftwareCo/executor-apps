import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.geekflare.com/endpoint/openapi.json" },
  allowedOrigin: "https://api.geekflare.com",
  // The document also declares admin bearer, cookie and internal-key schemes; only x-api-key is for users.
  securitySchemes: { "x-api-key": { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "x-api-key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
