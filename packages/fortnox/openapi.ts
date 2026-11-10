import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// openapi.json is the specification embedded in Fortnox's own API reference
// (https://apps.fortnox.se/apidocs), saved unchanged. Fortnox serves no stable download URL for it.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.fortnox.se",
  securitySchemes: {
    fortnoxOAuth2: {
      type: "oauth2",
      flows: {
        authorizationCode: {
          authorizationUrl: "https://apps.fortnox.se/oauth-v1/auth",
          tokenUrl: "https://apps.fortnox.se/oauth-v1/token",
          scopes: {},
        },
      },
    },
  },
  // Most operations declare no security; every one takes the OAuth access token as a bearer.
  fallbackSecurity: [{ fortnoxOAuth2: [] }],
  methods: {},
  oauth: ["fortnoxOAuth2"],
} satisfies OpenapiToolNamesOptions;
