import type { OpenapiToolNamesOptions } from "apps/openapi";

// Official Sage Sales Management (ForceManager) API v4 document. It lists production and sandbox
// servers; tools go to production only. Every operation requires the SessionKey scheme. The real
// session token comes from the login exchange in index.ts, whose fetch overwrites X-Session-Key,
// so the mapping below only satisfies the compiler and never reaches the wire.
export const options = {
  source: { url: "https://developer.forcemanager.com/openapi.json" },
  allowedOrigin: "https://api.forcemanager.com",
  securitySchemes: { SessionKey: { type: "apiKey", in: "header", name: "X-Session-Key" } },
  methods: { apiKey: [{ scheme: "SessionKey", field: "public_key", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
