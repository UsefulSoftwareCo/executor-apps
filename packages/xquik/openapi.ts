import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://xquik.com/openapi.json" },
  allowedOrigin: "https://xquik.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
