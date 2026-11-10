import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://v2.namsor.com/NamSorAPIv2/api2/openapi.json" },
  allowedOrigin: "https://v2.namsor.com",
  securitySchemes: { api_key: { type: "apiKey", name: "X-API-KEY", in: "header" } },
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
