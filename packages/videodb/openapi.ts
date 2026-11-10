import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.videodb.io/openapi.json" },
  allowedOrigin: "https://api.videodb.io",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-access-token" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
