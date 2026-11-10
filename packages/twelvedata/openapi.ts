import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.twelvedata.com/doc/swagger/openapi.json" },
  allowedOrigin: "https://api.twelvedata.com",
  securitySchemes: { authorizationHeader: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "authorizationHeader", field: "token", part: "value", prefix: "apikey " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
