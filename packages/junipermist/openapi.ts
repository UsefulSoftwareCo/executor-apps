import type { OpenapiToolNamesOptions } from "apps/openapi";

// Juniper's official Mist OpenAPI 3.1 document. Mist runs one API host per cloud region; index.ts swaps in the
// account's host, and https://api.mist.com is only used to compile.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/mistsys/mist_openapi/master/mist.openapi.json",
  },
  allowedOrigin: "https://api.mist.com",
  baseUrl: "https://api.mist.com",
  securitySchemes: { apiToken: { type: "apiKey", in: "header", name: "Authorization" } },
  fallbackSecurity: [{ apiToken: [] }],
  methods: {
    apiToken: [{ scheme: "apiToken", field: "apiToken", part: "value", prefix: "Token " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
