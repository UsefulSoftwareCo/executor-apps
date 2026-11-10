import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// document.json is Sensibo's own OpenAPI 3.1 document (https://sensibo.github.io/sensibo.openapi.yaml), converted
// from YAML to JSON unchanged; the importer rejects the live URL as an invalid definition. The API key travels as the
// `apiKey` query parameter. Some operations declare the /api/v1 server, which is the same origin.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://home.sensibo.com",
  securitySchemes: { api_key: { type: "apiKey", in: "query", name: "apiKey" } },
  fallbackSecurity: [{ api_key: [] }],
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
