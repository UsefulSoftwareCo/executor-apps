import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./openapi.json" with { type: "json" };

// openapi.json is Sendlane's official V2 document from its Stoplight docs project
// (https://sendlane.stoplight.io/api/v1/projects/sendlane/api-documentation/nodes/sendlane-v2.v2.yaml)
// with its relative $ref files (models/, responses/) inlined unchanged.
// The API token goes in the Authorization header as "Bearer <token>".
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.sendlane.com",
  securitySchemes: { BearerToken: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: {
    apiKey: [{ scheme: "BearerToken", field: "token", part: "value", prefix: "Bearer " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
