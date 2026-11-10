import type { OpenapiToolNamesOptions } from "apps/openapi";

// Polygon.io rebranded as Massive; the document is served by the API itself and declares a single
// `apiKey` query-parameter scheme. Massive also documents `Authorization: Bearer <key>`, which keeps the key
// out of URLs and logs, so the scheme is overridden to send the key as a Bearer header.
export const options = {
  source: { url: "https://api.massive.com/openapi" },
  allowedOrigin: "https://api.massive.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "Bearer " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
