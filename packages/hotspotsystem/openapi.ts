import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://www.hotspotsystem.com/apidocs/src/hss_v2_swagger.json" },
  allowedOrigin: "https://api.hotspotsystem.com",
  securitySchemes: { ApiKeyInHeader: { type: "apiKey", in: "header", name: "sn-apikey" } },
  methods: { apiKey: [{ scheme: "ApiKeyInHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
