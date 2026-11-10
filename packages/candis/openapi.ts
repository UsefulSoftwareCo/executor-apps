import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Candis publishes no combined OpenAPI file. Its ReadMe developer portal (developer.candis.io) embeds one
// OpenAPI definition per endpoint in each reference page (append .md), so document.json is those 27
// definitions merged; the OAuth endpoints are left out and the security scheme is the bearer token.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.candis.io",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  methods: { oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
