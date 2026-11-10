import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.getredo.com/v2.2/openapi.json" },
  allowedOrigin: "https://api.getredo.com",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ Bearer: [] }],
  methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/redo.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1stores~1{storeId}~1customer-portal/get/security", value: [] },
    { op: "add", path: "/paths/~1stores~1{storeId}~1coverage-info/get/security", value: [] },
    { op: "add", path: "/paths/~1stores~1{storeId}~1checkout-buttons-ui/get/security", value: [] },
    { op: "add", path: "/paths/~1stores~1{storeId}~1coverage-products/post/security", value: [] },
    { op: "add", path: "/paths/~1stores~1{storeId}~1admin/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
