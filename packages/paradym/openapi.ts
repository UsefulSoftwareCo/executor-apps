import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.paradym.id/openapi.json" },
  allowedOrigin: "https://api.paradym.id",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-access-token" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
