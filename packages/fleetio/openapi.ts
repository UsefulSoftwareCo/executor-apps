import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Fleetio publishes no downloadable OpenAPI file. developer.fleetio.com is generated from one, and
// every operation page embeds its own definition. document.json is those definitions (the current
// 2025-05-05 version of the docs) merged into one document, with only the 2xx responses kept.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://secure.fleetio.com",
  securitySchemes: {
    apiKey: { type: "apiKey", in: "header", name: "Authorization" },
    accountToken: { type: "apiKey", in: "header", name: "Account-Token" },
  },
  methods: {
    apiKey: [
      { scheme: "apiKey", field: "token", part: "value", prefix: "Token " },
      { scheme: "accountToken", field: "accountToken", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
