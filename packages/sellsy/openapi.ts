import type { OpenapiToolNamesOptions } from "apps/openapi";

// Sellsy's official API v2 description (the file its Redoc reference loads). Every operation uses the
// `oauth2` scheme; both the authorization-code and client-credentials accounts send the access token as a bearer.
export const options = {
  source: { url: "https://docs.sellsy.com/api/v2/dist/sellsy.v2.latest.yaml" },
  allowedOrigin: "https://api.sellsy.com",
  baseUrl: "https://api.sellsy.com/v2",
  securitySchemes: { oauth2: { type: "http", scheme: "bearer" } },
  methods: {
    oauth: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
    machine: [{ scheme: "oauth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
