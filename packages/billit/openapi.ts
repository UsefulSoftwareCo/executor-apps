import type { OpenapiToolNamesOptions } from "apps/openapi";

// Billit's official Swagger 2.0 document, linked from https://docs.billit.be/docs/swagger. The sandbox serves the
// same API at api.sandbox.billit.be, so index.ts pins each account's own origin. The document declares no
// security definitions; requests carry the `apikey` and `partyid` headers (see
// https://docs.billit.be/docs/partyid-and-key), declared here as two api-key schemes required together.
export const productionOrigin = "https://api.billit.be";
export const sandboxOrigin = "https://api.sandbox.billit.be";

export const options = {
  source: { url: `${productionOrigin}/swagger/docs/v1` },
  allowedOrigin: productionOrigin,
  baseUrl: productionOrigin,
  securitySchemes: {
    apikey: { type: "apiKey", name: "apikey", in: "header" },
    partyid: { type: "apiKey", name: "partyid", in: "header" },
  },
  fallbackSecurity: [{ apikey: [], partyid: [] }],
  methods: {
    apiKey: [
      { scheme: "apikey", field: "token", part: "value", prefix: "" },
      { scheme: "partyid", field: "partyId", part: "value", prefix: "" },
    ],
  },
  oauth: [],
  // OAuth token endpoints are not API tools.
  patches: [
    { op: "remove", path: "/paths/~1OAuth2~1token" },
    { op: "remove", path: "/paths/~1OAuth2~1revoke" },
  ],
} satisfies OpenapiToolNamesOptions;
