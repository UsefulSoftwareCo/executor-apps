import type { OpenapiToolNamesOptions } from "apps/openapi";

// The API key is sent as the raw value of the Authorization header (no scheme prefix).
export const options = {
  source: { url: "https://www.docugenerate.com/assets/articles/developers/reference/002-openapi-specification/docugenerate-api-1.9.1.json" },
  allowedOrigin: "https://api.docugenerate.com",
  securitySchemes: { "API Key": { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "API Key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
