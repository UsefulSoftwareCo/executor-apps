import type { OpenapiToolNamesOptions } from "apps/openapi";

// Microsoft's official Power BI REST API swagger (Swagger 2.0) from the PowerBI-CSharp SDK repo.
// It declares no security schemes; every operation takes an Entra ID bearer token.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/microsoft/PowerBI-CSharp/master/sdk/swaggers/swagger.json",
  },
  allowedOrigin: "https://api.powerbi.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  // The document's top-level `security: []` declares every operation public, overriding fallbackSecurity;
  // the Power BI API needs the bearer token on every call.
  patches: [{ op: "add", path: "/security", value: [{ bearer: [] }] }],
} satisfies OpenapiToolNamesOptions;
