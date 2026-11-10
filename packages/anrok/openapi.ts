import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://apidocs.anrok.com/openapi.yaml" },
  allowedOrigin: "https://api.anrok.com",
  securitySchemes: { http: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "http", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
