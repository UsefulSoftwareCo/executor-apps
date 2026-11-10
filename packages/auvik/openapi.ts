import type { OpenapiToolNamesOptions } from "apps/openapi";

// Auvik is hosted per region (auvikapi.<region>.my.auvik.com). index.ts swaps in the account's origin.
export const placeholderOrigin = "https://auvikapi.us1.my.auvik.com";

export const options = {
  source: { url: `${placeholderOrigin}/spec` },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { ApiKey: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "ApiKey", field: "username", part: "username", prefix: "" },
      { scheme: "ApiKey", field: "apiKey", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
