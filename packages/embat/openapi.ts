import type { OpenapiToolNamesOptions } from "apps/openapi";

// Embat's own OpenAPI document. Every operation requires `Authorization: Bearer <idToken>`.
// The idToken is exchanged from the service user's email and password in index.ts, which
// replaces the placeholder Authorization header the generated call carries. The document
// declares no servers, so the origin is pinned here.
export const options = {
  source: { url: "https://api.embat.io/openapi.json" },
  baseUrl: "https://api.embat.io",
  allowedOrigin: "https://api.embat.io",
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" } },
  methods: {
    login: [{ scheme: "HTTPBearer", field: "password", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
