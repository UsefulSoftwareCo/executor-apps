import type { OpenapiToolNamesOptions } from "apps/openapi";

// Harness's bundled API reference. Every operation is secured by the x-api-key header.
export const options = {
  source: { url: "https://apidocs.harness.io/_bundle/index.yaml?download" },
  allowedOrigin: "https://app.harness.io",
  securitySchemes: { "x-api-key": { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "x-api-key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
