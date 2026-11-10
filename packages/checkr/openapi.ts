import type { OpenapiToolNamesOptions } from "apps/openapi";

// Checkr's official OpenAPI document, published from its docs portal (docs.checkr.com).
// Requests use HTTP Basic with the API key (or a partner access token) as the username and an empty password.
export const options = {
  source: { url: "https://api.redocly.com/registry/bundle/checkr/Checkr%20Public%20API/v1/openapi.yaml" },
  allowedOrigin: "https://api.checkr.com",
  securitySchemes: { basic_auth: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [{ scheme: "basic_auth", field: "key", part: "username", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
