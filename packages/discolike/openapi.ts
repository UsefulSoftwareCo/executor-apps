import type { OpenapiToolNamesOptions } from "apps/openapi";

// DiscoLike's official OpenAPI 3.1 document declares no servers and its paths are relative to /v1. Its API key
// scheme names the header X-API-Key, but the docs (https://docs.discolike.com) specify x-discolike-key, so the
// scheme is redefined here. HTTP header names are case-insensitive; the name below follows the docs.
export const options = {
  source: { url: "https://api.discolike.com/v1/openapi.json" },
  allowedOrigin: "https://api.discolike.com",
  baseUrl: "https://api.discolike.com/v1",
  securitySchemes: {
    APIKeyHeader: { type: "apiKey", in: "header", name: "x-discolike-key" },
    HTTPBearer: { type: "http", scheme: "bearer" },
  },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ APIKeyHeader: [] }],
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/discolike.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1public~1signup/post/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
