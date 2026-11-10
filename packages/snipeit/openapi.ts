import type { OpenapiToolNamesOptions } from "apps/openapi";
import emptySecurity from "./empty-security.json" with { type: "json" };

// Snipe-IT's official REST API OpenAPI 3.1 document, published on its readme.io developer hub. Its only
// server is the public demo (https://develop.snipeitapp.com/api/v1) and it declares no security schemes,
// so index.ts pins each account's own host and the bearer token is declared here.
export const placeholderOrigin = "https://snipeit.example.com";

export const options = {
  source: { url: "https://snipe-it.readme.io/openapi/snipe-it-rest-api.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api/v1`,
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The document's top-level `security: [{}]` declares every operation public, overriding fallbackSecurity, and
  // 23 operations (assets, accessories, licenses...) are marked `security: []`; every operation needs the token.
  // empty-security.json lists those 23 (scripts/empty-security.ts). The document is not versioned, so a renamed
  // path makes its patch fail; regenerate the list then.
  patches: [
    { op: "add", path: "/security", value: [{ bearerAuth: [] }] },
    ...emptySecurity.map((operation) => ({ op: "add" as const, path: `${operation}/security`, value: [{ bearerAuth: [] }] })),
  ],
} satisfies OpenapiToolNamesOptions;
