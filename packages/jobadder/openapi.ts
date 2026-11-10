import type { OpenapiToolNamesOptions } from "apps/openapi";

// JobAdder's official OpenAPI 3.0 document. Its only server is the relative /v2, so baseUrl pins the API origin.
export const options = {
  source: { url: "https://api.jobadder.com/v2/openapi.json" },
  allowedOrigin: "https://api.jobadder.com",
  baseUrl: "https://api.jobadder.com/v2",
  securitySchemes: {
    jobadder_identity: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://id.jobadder.com/connect/authorize",
          tokenUrl: "https://id.jobadder.com/connect/token",
          scopes: {},
        },
      },
    },
  },
  fallbackSecurity: [{ jobadder_identity: [] }],
  methods: {},
  oauth: ["jobadder_identity"],
} satisfies OpenapiToolNamesOptions;
