import type { OpenapiToolNamesOptions } from "apps/openapi";

// Wrike's official OpenAPI 3.0 document for API v4. Its servers list three data centers;
// index.ts replaces the origin with the account's own host.
export const options = {
  source: { url: "https://developers.wrike.com/openapi/wrike_api_v4_ver154.yaml" },
  allowedOrigin: "https://www.wrike.com",
  securitySchemes: { HTTP: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "HTTP", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "HTTP", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
