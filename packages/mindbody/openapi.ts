import type { OpenapiToolNamesOptions } from "apps/openapi";

// Mindbody's official Public API v6 document is Swagger 2.0 at api.mindbodyonline.com. Every path
// starts with `/public/v{version}`; the `version` path parameter is bound to "6" by the app.
// The document declares only the `API-Key` header scheme; `siteId` is a required header parameter
// that the app binds from the account.
export const options = {
  source: { url: "https://api.mindbodyonline.com/public/v6/swagger/doc" },
  allowedOrigin: "https://api.mindbodyonline.com",
  baseUrl: "https://api.mindbodyonline.com",
  securitySchemes: { "API-Key": { type: "apiKey", in: "header", name: "API-Key" } },
  fallbackSecurity: [{ "API-Key": [] }],
  methods: { apiKey: [{ scheme: "API-Key", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
