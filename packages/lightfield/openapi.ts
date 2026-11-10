import type { OpenapiToolNamesOptions } from "apps/openapi";

// Lightfield's own Stainless-generated description, the one its official CLI is built from.
// The URL is content-addressed, so it never changes under us; bump it when Lightfield ships a new API version.
export const options = {
  source: {
    url: "https://storage.googleapis.com/stainless-sdk-openapi-specs/lightfield/lightfield-17ee537d0758c4a85d993301a200bff23a0d407be2e1ceaf2603746cdd51cfa7.yml",
  },
  allowedOrigin: "https://api.lightfield.app",
  baseUrl: "https://api.lightfield.app",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
