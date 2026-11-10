import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.dixa.io/_bundle/openapi/dixa-api/@v1/v1.json?download" },
  allowedOrigin: "https://dev.dixa.io",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
