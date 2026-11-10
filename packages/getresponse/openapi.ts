import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document lists three servers (global, MAX US, MAX PL); tools target api.getresponse.com.
export const options = {
  source: { url: "https://apireference.getresponse.com/open-api.json" },
  allowedOrigin: "https://api.getresponse.com",
  securitySchemes: {
    "api-key": { type: "apiKey", in: "header", name: "X-Auth-Token" },
    oauth2: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "api-key", field: "token", part: "value", prefix: "api-key " }],
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
