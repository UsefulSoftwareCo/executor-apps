import type { OpenapiToolNamesOptions } from "apps/openapi";

// Mezmo's combined spec declares one apiKey scheme sent as `Authorization: Token <key>`.
export const options = {
  source: { url: "https://docs.mezmo.com/apis/combined-mezmo-api.yaml" },
  allowedOrigin: "https://api.mezmo.com",
  securitySchemes: { AccessToken: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "AccessToken", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
