import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Simpplr's official B2B API definition (https://platform.simpplr.com/reference). The developer hub is a ReadMe
// site that publishes each operation page with its own slice of the definition and offers no downloadable file,
// so document.json is those slices merged. Its server and token URL are rewritten from the placeholder
// platform.{env}.simpplr.xyz / .app host to the real regional host: index.ts pins each account's own region.
export const placeholderOrigin = "https://platform.app.simpplr.com";

export const regions = ["app", "eu", "au", "ca"] as const;

export const options = {
  source: { document: document as never },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/v1`,
  // The access token is minted from the account's client credentials in index.ts (the token endpoint depends on the
  // tenant's region, which a static tokenUrl cannot express), so the scheme is filled as a bearer header.
  securitySchemes: { OAuth2ClientCredentials: { type: "http", scheme: "bearer" } },
  methods: {
    clientCredentials: [{ scheme: "OAuth2ClientCredentials", field: "clientSecret", part: "value", prefix: "" }],
  },
  // POST /b2b/content/files/list is a search, not a change.
  kinds: { getFilesFromSiteB2B: "query" },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
