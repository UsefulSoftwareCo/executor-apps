import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official OpenAPI 3.1 documents linked from https://developers.invofox.com/openapi.json.
// The webhooks-reference document describes inbound webhooks, not API calls, so it is not mounted.
export const options = {
  source: { url: "https://developers.invofox.com/openapi/main-reference.json" },
  allowedOrigin: "https://api.invofox.com",
  securitySchemes: { ApiKeyAuth: { type: "apiKey", name: "x-api-key", in: "header" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Deprecated operations, replaced by PATCH /documents/{id} and the ingest uploads.
  patches: [
    { op: "remove", path: "/paths/~1documents~1{id}~1type/put" },
    { op: "remove", path: "/paths/~1documents~1{id}~1publicState/put" },
  ],
} satisfies OpenapiToolNamesOptions;

export const ingestOptions = {
  source: { url: "https://developers.invofox.com/openapi/ingest-reference.json" },
  allowedOrigin: "https://api.invofox.com",
  // accessTokenAuth (x-access-token) is for browser sessions and is not offered.
  securitySchemes: { apiKeyAuth: { type: "apiKey", name: "x-api-key", in: "header" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: [
    { op: "remove", path: "/paths/~1v1~1ingest~1single/post" },
    { op: "remove", path: "/paths/~1v1~1ingest~1single-url/post" },
  ],
} satisfies OpenapiToolNamesOptions;
