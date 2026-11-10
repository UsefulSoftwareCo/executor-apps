import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.parsera.org/openapi.json" },
  baseUrl: "https://api.parsera.org",
  allowedOrigin: "https://api.parsera.org",
  securitySchemes: {
    APIKeyHeader: { type: "apiKey", in: "header", name: "X-API-KEY" },
    HTTPBearer: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [
      { scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" },
      { scheme: "HTTPBearer", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
