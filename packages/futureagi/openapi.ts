import type { OpenapiToolNamesOptions } from "apps/openapi";

// Future AGI's official OpenAPI document declares a bearer scheme, but its API reference
// (https://docs.futureagi.com/docs/api/) says every request carries `X-Api-Key` and `X-Secret-Key` headers,
// so the credentials are described here instead.
export const options = {
  source: { url: "https://docs.futureagi.com/openapi.json" },
  allowedOrigin: "https://api.futureagi.com",
  securitySchemes: {
    apiKey: { type: "apiKey", in: "header", name: "X-Api-Key" },
    secretKey: { type: "apiKey", in: "header", name: "X-Secret-Key" },
  },
  fallbackSecurity: [{ apiKey: [], secretKey: [] }],
  methods: {
    apiKey: [
      { scheme: "apiKey", field: "apiKey", part: "value", prefix: "" },
      { scheme: "secretKey", field: "secretKey", part: "value", prefix: "" },
    ],
  },
  oauth: [],
  // Replace the document's global bearer requirement with the header pair.
  // Also drop GET /model-hub/get-eval-logs-details/: the document gives it a required JSON body, which a GET
  // request cannot carry (the runtime's Request constructor throws), so the tool could never succeed.
  patches: [
    { op: "remove", path: "/paths/~1model-hub~1get-eval-logs-details~1" },
    { op: "replace", path: "/security", value: [{ apiKey: [], secretKey: [] }] },
  ],
} satisfies OpenapiToolNamesOptions;
