import type { OpenapiToolNamesOptions } from "apps/openapi";

// AgencyZoom's own OpenAPI document. Every operation requires `Authorization: Bearer <jwt>`.
// The `login` method has no JWT field: it is exchanged from the username and password in
// index.ts, which replaces the placeholder Authorization header the generated call carries.
export const options = {
  source: { url: "https://app.agencyzoom.com/openapi/agencyzoom.yaml" },
  allowedOrigin: "https://api.agencyzoom.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }],
    login: [{ scheme: "bearer", field: "password", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
