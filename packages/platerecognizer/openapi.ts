import type { OpenapiToolNamesOptions } from "apps/openapi";

// Plate Recognizer's own OpenAPI document (the one behind its API reference). It declares no servers, so
// baseUrl is set. Its tokenAuth scheme is an Authorization header whose value is "Token <key>".
export const options = {
  source: { url: "https://api.platerecognizer.com/v1/api-reference/schema/" },
  allowedOrigin: "https://api.platerecognizer.com",
  baseUrl: "https://api.platerecognizer.com",
  securitySchemes: { tokenAuth: { type: "apiKey", name: "Authorization", in: "header" } },
  methods: { apiKey: [{ scheme: "tokenAuth", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
