import type { OpenapiToolNamesOptions } from "apps/openapi";
import specDocument from "./spec.json" with { type: "json" };

// spec.json is the OpenAPI document Peerdom embeds in its public API docs page
// (https://api.peerdom.app/v1/docs), unchanged; Peerdom serves no standalone spec URL.
export const options = {
  source: { document: specDocument as never },
  allowedOrigin: "https://api.peerdom.app",
  securitySchemes: { "X-Api-Key": { type: "apiKey", name: "X-Api-Key", in: "header" } },
  methods: { apiKey: [{ scheme: "X-Api-Key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
