import type { OpenapiToolNamesOptions } from "apps/openapi";

// Gigasheet's official API reference (gigasheet.readme.io) publishes its OpenAPI 3.0 document
// through ReadMe's API registry. It declares the server as the protocol-relative "//api.gigasheet.com".
export const options = {
  source: { url: "https://dash.readme.com/api/v1/api-registry/ek5819fmuyh0dhj" },
  baseUrl: "https://api.gigasheet.com",
  allowedOrigin: "https://api.gigasheet.com",
  securitySchemes: {
    ApiKeyAuth: { type: "apiKey", name: "X-GIGASHEET-TOKEN", in: "header" },
  },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/gigasheet.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1ticintel~1npi~1{npi}~1public/get/security", value: [] },
    { op: "add", path: "/paths/~1user~1api-token~1create/post/security", value: [] },
    { op: "add", path: "/paths/~1user~1account~1deletion-request/post/security", value: [] },
    { op: "add", path: "/paths/~1user~1account~1{deletion-token}/delete/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
