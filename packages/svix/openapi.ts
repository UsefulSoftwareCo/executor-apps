import type { OpenapiToolNamesOptions } from "apps/openapi";

// Svix is hosted per region (us, eu, ca, au, in); index.ts swaps in the account's origin.
export const placeholderOrigin = "https://api.us.svix.com";

export const options = {
  source: { url: "https://api.svix.com/api/v1/openapi.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "HTTPBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
