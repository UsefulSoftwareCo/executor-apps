import type { OpenapiToolNamesOptions } from "apps/openapi";

// Document360's official v3 Customer API description. It also lists a US data center and private hosting server;
// this package targets the default (Europe) host.
export const options = {
  source: { url: "https://apihub.document360.io/swagger/v3/swagger.json" },
  allowedOrigin: "https://apihub.document360.io",
  securitySchemes: { ApiKey: { type: "apiKey", name: "X-API-Key", in: "header" } },
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
