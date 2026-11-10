import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.stability.ai/v2alpha/openapi" },
  allowedOrigin: "https://api.stability.ai",
  securitySchemes: { STABILITY_API_KEY: { type: "apiKey", in: "header", name: "authorization" } },
  methods: { apiKey: [{ scheme: "STABILITY_API_KEY", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
