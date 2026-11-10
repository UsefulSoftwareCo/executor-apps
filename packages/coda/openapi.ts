import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://coda.io/apis/v1/openapi.json" },
  allowedOrigin: "https://docs.superhuman.com",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
