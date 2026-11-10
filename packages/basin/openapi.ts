import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://usebasin.com/api_docs/v1/swagger.yaml" },
  allowedOrigin: "https://usebasin.com",
  securitySchemes: { TokenAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "TokenAuth", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
