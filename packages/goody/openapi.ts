import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://assets.ongoody.com/static/web/goody-api-openapi.json" },
  allowedOrigin: "https://api.ongoody.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
