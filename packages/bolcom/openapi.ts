import type { OpenapiToolNamesOptions } from "apps/openapi";

// bol.com's official Retailer API v10 document. It declares no servers and no per-operation
// security, so the patches add the server and a global bearer requirement. Responses are
// `application/vnd.retailer.v10+json`. The token is minted by the oauth2 client-credentials grant.
export const options = {
  source: { url: "https://api.bol.com/retailer/public/apispec/Retailer%20API%20-%20v10" },
  allowedOrigin: "https://api.bol.com",
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  methods: {
    clientCredentials: [{ scheme: "OAuth2", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches: [
    { op: "add", path: "/servers", value: [{ url: "https://api.bol.com" }] },
    { op: "add", path: "/security", value: [{ OAuth2: [] }] },
  ],
} satisfies OpenapiToolNamesOptions;
