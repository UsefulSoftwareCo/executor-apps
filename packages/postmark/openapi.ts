import type { OpenapiToolNamesOptions } from "apps/openapi";

// Postmark publishes two official Swagger 2.0 documents: the Server API (email, templates, bounces, stats) and
// the Account API (servers, domains, sender signatures). Each authenticates with its own header token, so each
// is only exposed to the auth method that holds that token.
export const serverOptions = {
  source: { url: "https://postmarkapp.com/swagger/server.yml" },
  allowedOrigin: "https://api.postmarkapp.com",
  baseUrl: "https://api.postmarkapp.com",
  securitySchemes: {
    serverToken: { type: "apiKey", in: "header", name: "X-Postmark-Server-Token" },
  },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ serverToken: [] }],
  methods: { serverToken: [{ scheme: "serverToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const accountOptions = {
  source: { url: "https://postmarkapp.com/swagger/account.yml" },
  allowedOrigin: "https://api.postmarkapp.com",
  baseUrl: "https://api.postmarkapp.com",
  securitySchemes: {
    accountToken: { type: "apiKey", in: "header", name: "X-Postmark-Account-Token" },
  },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ accountToken: [] }],
  methods: { accountToken: [{ scheme: "accountToken", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`; the Server API is the main one.
export const options = serverOptions;
