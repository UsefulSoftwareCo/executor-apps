import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://help.sendspark.com/api-reference/openapi.json" },
  allowedOrigin: "https://api-gw.sendspark.com",
  baseUrl: "https://api-gw.sendspark.com",
  securitySchemes: {
    apiKey: { type: "apiKey", in: "header", name: "x-api-key" },
    apiSecret: { type: "apiKey", in: "header", name: "x-api-secret" },
  },
  methods: {
    apiKey: [
      { scheme: "apiKey", field: "apiKey", part: "value" as const, prefix: "" },
      { scheme: "apiSecret", field: "apiSecret", part: "value" as const, prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
