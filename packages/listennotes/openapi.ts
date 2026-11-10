import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://listen-api.listennotes.com/api/v2/openapi.json" },
  allowedOrigin: "https://listen-api.listennotes.com",
  securitySchemes: {
    ListenApiKey: { type: "apiKey", in: "header", name: "X-ListenAPI-Key" },
  },
  methods: { apiKey: [{ scheme: "ListenApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
