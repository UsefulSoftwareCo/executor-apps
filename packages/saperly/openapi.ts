import type { OpenapiToolNamesOptions } from "apps/openapi";

// Saperly's document declares no security schemes; every authenticated operation takes a bearer API key (sap_sk_live_...).
export const options = {
  source: { url: "https://saperly.com/openapi-bundled.json" },
  allowedOrigin: "https://api.saperly.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  // The document declares OpenAPI 3.2.0, which the compiler rejects; its content is valid 3.1.
  patches: [{ op: "replace", path: "/openapi", value: "3.1.0" }],
  oauth: [],
} satisfies OpenapiToolNamesOptions;
