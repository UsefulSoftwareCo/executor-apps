import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.cloudsmith.io/v1/swagger/?format=openapi" },
  allowedOrigin: "https://api.cloudsmith.io",
  securitySchemes: { apikey: { type: "apiKey", name: "X-Api-Key", in: "header" } },
  methods: { apiKey: [{ scheme: "apikey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
