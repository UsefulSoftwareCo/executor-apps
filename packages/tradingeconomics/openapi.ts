import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.tradingeconomics.com/swagger/v1/swagger.json" },
  baseUrl: "https://api.tradingeconomics.com",
  allowedOrigin: "https://api.tradingeconomics.com",
  securitySchemes: { OAuth2: { type: "apiKey", in: "query", name: "c" } },
  methods: { apiKey: [{ scheme: "OAuth2", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
