import type { OpenapiToolNamesOptions } from "apps/openapi";

// Apollo's document also declares a bearerAuth scheme for partner OAuth; only the API key is offered here.
export const options = {
  source: { url: "https://docs.apollo.io/openapi/apollo-rest-api.json" },
  allowedOrigin: "https://api.apollo.io",
  securitySchemes: { apiKey: { type: "apiKey", name: "x-api-key", in: "header" } },
  fallbackSecurity: [{ apiKey: [] }],
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
