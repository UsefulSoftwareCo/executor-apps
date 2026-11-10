import type { OpenapiToolNamesOptions } from "apps/openapi";

// The /x402 endpoints are pay-per-call endpoints authorised by on-chain payment, not an API key; drop them.
const patches = [
  { op: "remove", path: "/paths/~1x402~1session" },
  { op: "remove", path: "/paths/~1x402~1web~1fetch" },
  { op: "remove", path: "/paths/~1x402~1web~1search" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://www.hyperbrowser.ai/docs/openapi.json" },
  allowedOrigin: "https://api.hyperbrowser.ai",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
