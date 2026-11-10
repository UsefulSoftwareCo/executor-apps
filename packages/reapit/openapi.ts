import type { OpenapiToolNamesOptions } from "apps/openapi";

// Reapit's official Swagger 2.0 document, served unauthenticated at https://platform.reapit.cloud/docs
// (host platform.reapit.cloud, no basePath, no schemes). The framework upgrades Swagger 2.0 itself.
// Every operation requires the document's "Authorization" apiKey header, which carries "Bearer <token>".
// The api-version and reapit-customer headers, and the client-credentials token, are added in index.ts.
export const origin = "https://platform.reapit.cloud";

export const options = {
  source: { url: `${origin}/docs` },
  allowedOrigin: origin,
  baseUrl: origin,
  securitySchemes: { Authorization: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: {
    // The client-credentials token is minted in index.ts and replaces this placeholder.
    clientCredentials: [{ scheme: "Authorization", field: "clientSecret", part: "value", prefix: "Bearer " }],
    oauth: [{ scheme: "Authorization", field: "access_token", part: "value", prefix: "Bearer " }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
