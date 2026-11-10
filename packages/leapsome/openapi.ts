import type { OpenapiToolNamesOptions } from "apps/openapi";
import contentDocument from "./content.json" with { type: "json" };
import scimDocument from "./scim.json" with { type: "json" };

// Both documents are the ones Leapsome embeds in its own Swagger UI pages
// (https://api.leapsome.com/v1/api-docs/ and https://api.leapsome.com/scim/v1/api-docs/); Leapsome
// publishes no standalone spec file. The Content API's `/token` operation is dropped: the app
// performs the secret-for-JWT exchange itself so the API Secret never appears in a tool call.
export const contentOptions = {
  source: { document: contentDocument as never },
  allowedOrigin: "https://api.leapsome.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiSecret: [{ scheme: "bearerAuth", field: "secret", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const scimOptions = {
  source: { document: scimDocument as never },
  allowedOrigin: "https://api.leapsome.com",
  securitySchemes: { "SCIM-Token": { type: "http", scheme: "bearer" } },
  methods: { scimToken: [{ scheme: "SCIM-Token", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const options = contentOptions;
