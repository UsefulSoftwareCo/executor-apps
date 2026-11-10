import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// Nutshell publishes its REST definition one operation per reference page on
// developers.nutshell.com (no single document), so document.json is those 114 page
// definitions merged unchanged except for the server URL, which the pages give without a scheme.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://app.nutshell.com",
  baseUrl: "https://app.nutshell.com/rest",
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "email", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "apiKey", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
