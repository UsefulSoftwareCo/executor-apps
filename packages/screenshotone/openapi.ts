import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.screenshotone.com/openapi.json" },
  allowedOrigin: "https://api.screenshotone.com",
  securitySchemes: {
    accessKeyHeader: { type: "apiKey", name: "X-Access-Key", in: "header" },
  },
  methods: { apiKey: [{ scheme: "accessKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
