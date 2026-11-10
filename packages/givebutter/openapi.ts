import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://givebutter.com/docs/api.json" },
  allowedOrigin: "https://api.givebutter.com",
  securitySchemes: { http: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "http", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
