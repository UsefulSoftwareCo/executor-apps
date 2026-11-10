import type { OpenapiToolNamesOptions } from "apps/openapi";

// ClickHouse Cloud's official OpenAPI document is served by the API itself.
export const options = {
  source: { url: "https://api.clickhouse.cloud/v1" },
  allowedOrigin: "https://api.clickhouse.cloud",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "keyId", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "keySecret", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
