import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://app.findymail.com/docs/openapi.yaml" },
  allowedOrigin: "https://app.findymail.com",
  securitySchemes: { default: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "default", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
