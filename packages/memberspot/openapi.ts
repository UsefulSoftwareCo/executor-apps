import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.memberspot.de/api-json" },
  allowedOrigin: "https://api.memberspot.de",
  baseUrl: "https://api.memberspot.de",
  securitySchemes: {
    "X-API-KEY": { type: "apiKey", name: "X-API-KEY", in: "header" },
  },
  methods: { apiKey: [{ scheme: "X-API-KEY", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
