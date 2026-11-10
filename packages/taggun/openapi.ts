import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// Taggun publishes one OpenAPI fragment per endpoint on developers.taggun.io (under "OpenAPI definition"
// on each reference page) and no combined document, so openapi.json merges those fragments.
export const options = {
  source: { document },
  allowedOrigin: "https://api.taggun.io",
  securitySchemes: { apikey: { type: "apiKey", in: "header", name: "apikey" } },
  methods: { apiKey: [{ scheme: "apikey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
