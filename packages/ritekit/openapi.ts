import type { OpenapiToolNamesOptions } from "apps/openapi";

// RiteKit publishes no OpenAPI document of its own; this is the APIs.guru conversion of its
// Postman/API Blueprint docs. It declares no security scheme: every call takes the developer
// dashboard Client ID as the `client_id` query parameter.
export const options = {
  source: { url: "https://api.apis.guru/v2/specs/ritekit.com/1.0.0/openapi.json" },
  allowedOrigin: "https://api.ritekit.com",
  securitySchemes: { clientId: { type: "apiKey", in: "query", name: "client_id" } },
  fallbackSecurity: [{ clientId: [] }],
  methods: { apiKey: [{ scheme: "clientId", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
