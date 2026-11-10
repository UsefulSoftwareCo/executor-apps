import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://raw.githubusercontent.com/useautumn/autumn/main/apps/docs/mintlify/api/openapi.yml" },
  allowedOrigin: "https://api.useautumn.com",
  securitySchemes: { secretKey: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "secretKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
