import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./finmo.json" with { type: "json" };

// Finmo's docs site (docs.finmo.net) embeds one OpenAPI definition per endpoint and publishes no
// combined file, so finmo.json is those official definitions merged into one document (fetched from
// the .md form of each reference page listed in https://docs.finmo.net/llms.txt), with examples removed.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.finmo.net",
  securitySchemes: { basic: { type: "http", scheme: "basic" } },
  // Access API key is the Basic username, Secret API key the password.
  methods: {
    apiKey: [
      { scheme: "basic", field: "accessKey", part: "username", prefix: "" },
      { scheme: "basic", field: "secretKey", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
