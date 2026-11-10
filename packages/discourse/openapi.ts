import type { OpenapiToolNamesOptions } from "apps/openapi";

// Discourse's official API documentation OpenAPI 3.1 document (docs.discourse.org, built from the
// discourse/discourse_api_docs repository). Its only server is https://{defaultHost}, so index.ts pins each
// account's own forum host. The document declares no security schemes: Discourse expects the Api-Key and
// Api-Username headers together on every authenticated request.
export const placeholderOrigin = "https://discourse.example.com";

export const options = {
  source: { url: "https://docs.discourse.org/openapi.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: {
    apiKey: { type: "apiKey", in: "header", name: "Api-Key" },
    apiUsername: { type: "apiKey", in: "header", name: "Api-Username" },
  },
  fallbackSecurity: [{ apiKey: [], apiUsername: [] }],
  methods: {
    apiKey: [
      { scheme: "apiKey", field: "apiKey", part: "value", prefix: "" },
      { scheme: "apiUsername", field: "apiUsername", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
