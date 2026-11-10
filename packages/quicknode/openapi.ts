import type { OpenapiToolNamesOptions } from "apps/openapi";

// Quicknode's official REST documents, all served from api.quicknode.com:
//  - Admin API (endpoints, chains, security, rate limits, metrics, usage, billing)
//  - Streams REST API
//  - Webhooks REST API
// The Streams and Webhooks documents declare no servers, so the origin is supplied here.
const credentials = {
  allowedOrigin: "https://api.quicknode.com",
  baseUrl: "https://api.quicknode.com",
  oauth: [],
} as const;

export const options = {
  source: { url: "https://www.quicknode.com/api-docs/v0/swagger.json" },
  ...credentials,
  // The Team operations name a scheme "bearerAuth" that the document never declares (it declares
  // "bearer_auth"). A live probe shows the server reads the key only from the x-api-key header (a Bearer
  // header gets 401 "Api key is missing under x-api-key header"), so that scheme is declared as the same
  // x-api-key header and the one API key fills both.
  securitySchemes: {
    api_key: { type: "apiKey", name: "x-api-key", in: "header" },
    bearerAuth: { type: "apiKey", name: "x-api-key", in: "header" },
  },
  methods: {
    apiKey: [
      { scheme: "api_key", field: "token", part: "value", prefix: "" },
      { scheme: "bearerAuth", field: "token", part: "value", prefix: "" },
    ],
  },
} satisfies OpenapiToolNamesOptions;

const xApiKey = {
  securitySchemes: { "x-api-key": { type: "apiKey", name: "x-api-key", in: "header" } },
  methods: { apiKey: [{ scheme: "x-api-key", field: "token", part: "value", prefix: "" }] },
} as const;

export const streamsOptions = {
  source: { url: "https://api.quicknode.com/streams/rest/openapi.json" },
  ...credentials,
  ...xApiKey,
} satisfies OpenapiToolNamesOptions;

export const webhooksOptions = {
  source: { url: "https://api.quicknode.com/webhooks/rest/openapi.json" },
  ...credentials,
  ...xApiKey,
} satisfies OpenapiToolNamesOptions;
