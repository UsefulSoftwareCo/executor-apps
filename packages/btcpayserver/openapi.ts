import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// BTCPay Server's official Greenfield API document (OpenAPI 3.0), published with the BTCPay docs and
// vendored by generate.mjs (it fixes the API_Key/Basic security requirement).
// Every instance serves the same API under /api/v1; index.ts points calls at the account's own instance.
export const placeholderOrigin = "https://mainnet.demo.btcpayserver.org";

export const options = {
  source: { document },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // The spec's API_Key scheme: `Authorization: token <API key>`.
  securitySchemes: { API_Key: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: {
    apiKey: [{ scheme: "API_Key", field: "token", part: "value", prefix: "token " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
