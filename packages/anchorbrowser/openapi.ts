import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.anchorbrowser.io/openapi.yaml" },
  allowedOrigin: "https://api.anchorbrowser.io",
  securitySchemes: {
    api_key_header: { type: "apiKey", in: "header", name: "anchor-api-key" },
  },
  methods: { apiKey: [{ scheme: "api_key_header", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
