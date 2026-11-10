import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// document.json is the OpenAPI 3 description Buildium embeds in https://developer.buildium.com/ (the
// page renders it with Redoc; there is no separate download URL), extracted unchanged. It declares no
// security schemes, so the two API key headers are declared here and applied to every operation.
export const options = {
  source: { document: document as never },
  allowedOrigin: "https://api.buildium.com",
  securitySchemes: {
    clientId: { type: "apiKey", in: "header", name: "x-buildium-client-id" },
    clientSecret: { type: "apiKey", in: "header", name: "x-buildium-client-secret" },
  },
  fallbackSecurity: [{ clientId: [], clientSecret: [] }],
  methods: {
    apiKey: [
      { scheme: "clientId", field: "clientId", part: "value", prefix: "" },
      { scheme: "clientSecret", field: "clientSecret", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
