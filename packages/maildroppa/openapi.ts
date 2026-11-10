import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.maildroppa.com/openapi" },
  baseUrl: "https://api.maildroppa.com",
  allowedOrigin: "https://api.maildroppa.com",
  securitySchemes: { ApiUser: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "ApiUser", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
