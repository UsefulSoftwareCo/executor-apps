import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://docs.apify.com/api/openapi.json" },
  allowedOrigin: "https://api.apify.com",
  securitySchemes: { httpBearer: { type: "http", scheme: "bearer" } },
  methods: {
    apiKey: [{ scheme: "httpBearer", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "httpBearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
