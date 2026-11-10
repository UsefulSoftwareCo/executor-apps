import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./rest-api.json" with { type: "json" };

// Make embeds one OpenAPI 3.0.0 document ("Web API v2 - Public") per endpoint on the pages of
// https://developers.make.com/api-documentation/api-reference. rest-api.json merges those
// documents unchanged. Each organization lives on a zone, so index.ts sets the origin per account.
export const defaultOrigin = "https://eu1.make.com";

export const options = {
  source: { document: document as never },
  allowedOrigin: defaultOrigin,
  baseUrl: `${defaultOrigin}/api/v2`,
  securitySchemes: { token: { type: "apiKey", name: "Authorization", in: "header" } },
  fallbackSecurity: [{ token: [] }],
  // The API expects "Authorization: Token <api token>".
  methods: { token: [{ scheme: "token", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
