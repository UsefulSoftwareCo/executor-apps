import type { OpenapiToolNamesOptions } from "apps/openapi";

// Paddle's official OpenAPI 3.1 document for the Billing API. It lists both the sandbox and live servers, so
// index.ts pins each account's chosen origin through baseUrl/allowedOrigin.
export const origins = {
  live: "https://api.paddle.com",
  sandbox: "https://sandbox-api.paddle.com",
} as const;

export const options = {
  source: { url: "https://raw.githubusercontent.com/PaddleHQ/paddle-openapi/main/v1/openapi.yaml" },
  allowedOrigin: origins.live,
  baseUrl: origins.live,
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
