import type { OpenapiToolNamesOptions } from "apps/openapi";

// 3CX's official XAPI OpenAPI 3.0 document, published in the 3cx/xapi-tutorial repository (every V20 server also
// serves it at /xapi/v1/swagger.yaml). The document's only server is the relative /xapi/v1, so index.ts pins each
// account's own PBX host.
export const placeholderOrigin = "https://pbx.example.com";

export const options = {
  source: { url: "https://raw.githubusercontent.com/3cx/xapi-tutorial/master/swagger.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/xapi/v1`,
  // The document declares one oauth2 scheme named Application. The access token is minted from the account's
  // client credentials in index.ts (the token endpoint is on the PBX host, which a static tokenUrl cannot express),
  // so the scheme is filled as a bearer header from the account's token.
  securitySchemes: { Application: { type: "http", scheme: "bearer" } },
  methods: {
    clientCredentials: [{ scheme: "Application", field: "clientSecret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
