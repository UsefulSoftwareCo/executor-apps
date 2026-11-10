import type { OpenapiToolNamesOptions } from "apps/openapi";

// Lob's repository keeps the source multi-file; CI publishes the single-file bundle on the deployment branch.
export const options = {
  source: { url: "https://raw.githubusercontent.com/lob/lob-openapi/deployment/dist/lob-api-bundled.yml" },
  allowedOrigin: "https://api.lob.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  // The secret API key is the Basic username; the password stays empty.
  methods: { apiKey: [{ scheme: "basicAuth", field: "token", part: "username", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
