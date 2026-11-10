import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://opencagedata.com/openapi.yaml" },
  allowedOrigin: "https://api.opencagedata.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "query", name: "key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The document declares OpenAPI 3.2.0, which the compiler rejects; nothing else it uses is 3.2-specific.
  patches: [{ op: "replace", path: "/openapi", value: "3.1.0" }],
} satisfies OpenapiToolNamesOptions;
