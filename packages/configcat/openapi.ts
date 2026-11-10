import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.configcat.com/docs/v1/swagger.json" },
  allowedOrigin: "https://api.configcat.com",
  securitySchemes: { Basic: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "Basic", field: "username", part: "username", prefix: "" },
      { scheme: "Basic", field: "password", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// The SCIM user-provisioning API is a separate official OpenAPI 3 document on its own host, authenticated
// with an organization-level SCIM token rather than the Public API credentials.
export const scimOptions = {
  source: { url: "https://scim-api.configcat.com/openapi/v1/openapi.json" },
  allowedOrigin: "https://scim-api.configcat.com",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  methods: { scim: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
