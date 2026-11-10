import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.contractbook.com/v3/docs/public/v3/openapi-v3.json" },
  allowedOrigin: "https://api.contractbook.com",
  securitySchemes: { authorization: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "authorization", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The document's top-level `security: []` declares every operation public, but each one needs the API key.
  patches: [{ op: "add", path: "/security", value: [{ authorization: [] }] }],
} satisfies OpenapiToolNamesOptions;
