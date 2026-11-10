import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./spec.json" with { type: "json" };

// Sedna publishes no single downloadable OpenAPI file. Its ReadMe reference (developers.sedna.com) embeds the
// official OpenAPI 3.0 definition in each operation page (append .md to a reference URL). spec.json is those
// per-operation definitions from the vendor's own docs merged unchanged, minus the /oauth/token operation, which
// index.ts calls itself. The only server is https://{tenant}.sednanetwork.com/platform, so index.ts pins each
// account's own tenant.
export const placeholderOrigin = "https://tenant.sednanetwork.com";

export const options = {
  source: { document: document as never },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/platform`,
  // The document declares Basic and OAuth (client credentials). The access token is minted in index.ts, so both
  // client-credentials accounts and token-less ones fill these simple schemes.
  securitySchemes: {
    Basic: { type: "http", scheme: "basic" },
    OAuth: { type: "http", scheme: "bearer" },
  },
  methods: {
    basic: [
      { scheme: "Basic", field: "clientId", part: "username", prefix: "" },
      { scheme: "Basic", field: "clientSecret", part: "password", prefix: "" },
    ],
    clientCredentials: [{ scheme: "OAuth", field: "clientSecret", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
