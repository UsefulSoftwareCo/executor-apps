import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// N-able publishes no single OpenAPI file at a stable URL: every N-central server generates its own (Swagger UI at
// /api-explorer) and the developer portal (https://developer.n-able.com/n-central/reference) embeds one OpenAPI
// fragment per operation. openapi.json is those official fragments merged unchanged, minus the two token-exchange
// operations (authenticate, refresh), which index.ts performs itself. The document's server is the placeholder
// https://{custom-server}/, so index.ts pins each account's own server as the base URL.
export const placeholderOrigin = "https://ncentral.example.com";

export const options = {
  source: { document: document as never },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // Operations declare the API-Access token as a bearer scheme. The access token is minted from the account's
  // User-API token in index.ts, which replaces the Authorization header, so the field named here is only the
  // framework's placeholder.
  securitySchemes: { "API-Access_Token": { type: "http", scheme: "bearer" } },
  methods: { userApiToken: [{ scheme: "API-Access_Token", field: "userApiToken", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
