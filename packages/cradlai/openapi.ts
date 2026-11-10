import type { OpenapiToolNamesOptions } from "apps/openapi";

// Cradl's official OpenAPI document, published with its docs. It declares one OAuth2 client-credentials
// scheme named "OAuth2"; the access token is sent as a bearer token. The server URL is templated on the
// API version ("v1"), all on api.cradl.ai.
export const options = {
  source: { url: "https://docs.cradl.ai/api-reference/openapi.json" },
  allowedOrigin: "https://api.cradl.ai",
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ OAuth2: [] }],
  methods: {
    clientCredentials: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
