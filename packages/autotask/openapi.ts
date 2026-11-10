import type { OpenapiToolNamesOptions } from "apps/openapi";

// Autotask PSA is served per zone (webservices<N>.autotask.net). Datto publishes the same
// Swagger document on every zone; this reads zone 2's copy and index.ts swaps in the account's zone.
export const placeholderOrigin = "https://webservices2.autotask.net";

export const options = {
  source: { url: `${placeholderOrigin}/atservicesrest/swagger/docs/v1` },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/ATServicesRest`,
  // The document declares no security. Autotask API users authenticate with three headers.
  securitySchemes: {
    integrationCode: { type: "apiKey", in: "header", name: "ApiIntegrationCode" },
    userName: { type: "apiKey", in: "header", name: "UserName" },
    secret: { type: "apiKey", in: "header", name: "Secret" },
  },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ integrationCode: [], secret: [], userName: [] }],
  methods: {
    apiKey: [
      { scheme: "integrationCode", field: "integrationCode", part: "value", prefix: "" },
      { scheme: "userName", field: "username", part: "value", prefix: "" },
      { scheme: "secret", field: "secret", part: "value", prefix: "" },
    ],
  },
  oauth: [],
  // Public operations keep no security (catalog/status/autotask.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1V1.0~1ZoneInformation/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
