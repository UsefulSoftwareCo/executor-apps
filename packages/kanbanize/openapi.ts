import type { OpenapiToolNamesOptions } from "apps/openapi";

// Kanbanize (now Businessmap) is hosted per account (<subdomain>.kanbanize.com). index.ts swaps in
// the account's origin; the definition is the same on every account, and the public demo account
// serves it without credentials.
export const placeholderOrigin = "https://demo.kanbanize.com/api/v2";

export const options = {
  source: { url: "https://demo.kanbanize.com/openapi/json" },
  allowedOrigin: "https://demo.kanbanize.com",
  baseUrl: placeholderOrigin,
  // The definition also lists an OAuth2 client-credentials scheme whose documented token URL is
  // the demo account's; only the API key is offered because the framework's client_credentials grant
  // takes a static tokenUrl and cannot be templated per account.
  securitySchemes: { apikey: { type: "apiKey", name: "apikey", in: "header" } },
  methods: { apiKey: [{ scheme: "apikey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
