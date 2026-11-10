import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.collegefootballdata.com/api-docs.json" },
  allowedOrigin: "https://api.collegefootballdata.com",
  securitySchemes: { apiKey: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
