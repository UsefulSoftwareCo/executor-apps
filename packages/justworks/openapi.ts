import type { OpenapiToolNamesOptions } from "apps/openapi";
import { document } from "./spec.ts";

// Justworks' official OpenAPI document (see spec.ts). It declares no servers and one oauth2 scheme.
export const options = {
  source: { document },
  allowedOrigin: "https://public-api.justworks.com",
  baseUrl: "https://public-api.justworks.com",
  securitySchemes: {
    OAuth2CompanyAccessToken: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://payroll.justworks.com/oauth/authorize",
          tokenUrl: "https://public-api.justworks.com/oauth/token",
          refreshUrl: "https://public-api.justworks.com/oauth/token",
          scopes: {},
        },
      },
    },
  },
  methods: {},
  oauth: ["OAuth2CompanyAccessToken"],
} satisfies OpenapiToolNamesOptions;
