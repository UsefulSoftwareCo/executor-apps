import type { OpenapiToolNamesOptions } from "apps/openapi";

// Cashfree's official Payment Gateway OpenAPI document. It lists a sandbox and a production server;
// index.ts pins the account's own environment as the only origin that receives credentials.
export const environments = {
  production: "https://api.cashfree.com",
  sandbox: "https://sandbox.cashfree.com",
} as const;

export const options = {
  source: { url: "https://www.cashfree.com/docs/openapi/payments/v2026-01-01.yaml" },
  allowedOrigin: environments.production,
  baseUrl: `${environments.production}/pg`,
  securitySchemes: {
    XClientID: { type: "apiKey", in: "header", name: "x-client-id" },
    XClientSecret: { type: "apiKey", in: "header", name: "x-client-secret" },
  },
  methods: {
    apiKey: [
      { scheme: "XClientID", field: "client_id", part: "value", prefix: "" },
      { scheme: "XClientSecret", field: "client_secret", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
