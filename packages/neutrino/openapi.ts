import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.neutrinoapi.com/api/openapi.json" },
  allowedOrigin: "https://neutrinoapi.net",
  securitySchemes: {
    "user-id": { type: "apiKey", name: "user-id", in: "header" },
    "api-key": { type: "apiKey", name: "api-key", in: "header" },
  },
  methods: {
    apiKey: [
      { scheme: "user-id", field: "userId", part: "value", prefix: "" },
      { scheme: "api-key", field: "apiKey", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
