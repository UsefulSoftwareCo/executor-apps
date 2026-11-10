import type { OpenapiToolNamesOptions } from "apps/openapi";

// lemlist's official v2 OpenAPI document, linked from https://developer.lemlist.com/llms.txt.
export const options = {
  source: { url: "https://developer.lemlist.com/api-reference/openapi/v2.json" },
  allowedOrigin: "https://api.lemlist.com",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  // The Basic username is always empty; the API key is the password.
  methods: { apiKey: [{ scheme: "basicAuth", field: "token", part: "password", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
