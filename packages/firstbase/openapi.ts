import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://apipub.firstbasehq.com/v3/api-docs" },
  allowedOrigin: "https://apipub.firstbasehq.com",
  securitySchemes: { ApiKey: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "ApiKey " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
