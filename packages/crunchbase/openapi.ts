import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.swaggerhub.com/apis/Crunchbase/crunchbase-enterprise_api/1.0.3" },
  allowedOrigin: "https://api.crunchbase.com",
  securitySchemes: { ApiKeyAuthHeader: { type: "apiKey", in: "header", name: "X-cb-user-key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuthHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
