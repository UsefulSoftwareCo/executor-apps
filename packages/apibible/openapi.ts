import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.scripture.api.bible/v1/swagger.json" },
  allowedOrigin: "https://rest.api.bible",
  securitySchemes: {
    "API Key": { type: "apiKey", in: "header", name: "api-key" },
  },
  methods: { apiKey: [{ scheme: "API Key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
