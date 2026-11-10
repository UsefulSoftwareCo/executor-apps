import type { OpenapiToolNamesOptions } from "apps/openapi";

// Trackdesk is hosted per program (<tenantId>.trackdesk.com). index.ts swaps in the account's origin.
export const placeholderOrigin = "https://tenant.trackdesk.com";

export const options = {
  source: { url: "https://developers.trackdesk.com/api.instance.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { "X-Api-Key": { type: "apiKey", in: "header", name: "X-Api-Key" } },
  methods: { apiKey: [{ scheme: "X-Api-Key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The document marks these two GET operations as state-changing ("Create conversion", "Update conversion").
  kinds: { ConversionService_CreateConversion2: "mutation", ConversionService_UpdateConversion2: "mutation" },
  // The document's server URL is a template with a placeholder default; pin the real origin.
  // Also drop the OAuth2 client-management endpoints: they are noise for an API-key account.
  patches: [
    { op: "replace", path: "/servers", value: [{ url: placeholderOrigin }] },
    { op: "remove", path: "/paths/~1api~1node~1oauth~1register" },
    { op: "remove", path: "/paths/~1api~1node~1oauth~1revoke" },
    { op: "remove", path: "/paths/~1api~1node~1oauth~1token" },
    { op: "remove", path: "/paths/~1api~1node~1oauth~1check" },
  ],
} satisfies OpenapiToolNamesOptions;
