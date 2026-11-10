import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.onetapcheckin.com/docs/openapi.yaml" },
  allowedOrigin: "https://api.onetapcheckin.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
