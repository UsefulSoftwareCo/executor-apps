import type { OpenapiToolNamesOptions } from "apps/openapi";

// The document names three schemes: `apikey` (Authorization header, used by most operations),
// BearerAuth and ApiKeyAuth (x-api-key). The vendor docs say to send `Authorization: Bearer <key>`,
// so all three are filled from the one token, with the Bearer prefix on the Authorization header.
export const options = {
  source: { url: "https://apipie.ai/docs/openapi.json" },
  allowedOrigin: "https://apipie.ai",
  securitySchemes: {
    apikey: { type: "apiKey", in: "header", name: "Authorization" },
    BearerAuth: { type: "http", scheme: "bearer" },
    ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
  },
  methods: {
    apiKey: [
      { scheme: "apikey", field: "token", part: "value", prefix: "Bearer " },
      { scheme: "BearerAuth", field: "token", part: "value", prefix: "" },
      { scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
