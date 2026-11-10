import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.tisane.ai/_bundle/apis/tisane-api-short.yaml" },
  allowedOrigin: "https://api.tisane.ai",
  securitySchemes: {
    "Tisane-API-Key": { type: "apiKey", name: "Ocp-Apim-Subscription-Key", in: "header" },
  },
  methods: { apiKey: [{ scheme: "Tisane-API-Key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
