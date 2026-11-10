import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.ahrefs.com/openapi.json" },
  allowedOrigin: "https://api.ahrefs.com",
  securitySchemes: { http: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "http", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "http", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
