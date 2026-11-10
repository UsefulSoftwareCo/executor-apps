import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.linkup.so/v1/openapi.json" },
  allowedOrigin: "https://api.linkup.so",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
