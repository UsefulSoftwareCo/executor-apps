import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://doc.bettercontact.rocks/api-reference/openapi.json" },
  allowedOrigin: "https://app.bettercontact.rocks",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
