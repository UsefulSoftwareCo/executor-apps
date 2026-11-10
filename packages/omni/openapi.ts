import type { OpenapiToolNamesOptions } from "apps/openapi";

// Omni is hosted per instance (https://<instance>.omniapp.co/api). index.ts swaps in the account's
// origin; the document is the same for every instance. Official document linked from
// https://docs.omni.co/llms.txt.
export const placeholderOrigin = "https://your-instance.omniapp.co";

export const options = {
  source: { url: "https://docs.omni.co/api/openapi.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: {
    bearerAuth: { type: "http", scheme: "bearer" },
    orgApiKey: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [
      { scheme: "bearerAuth", field: "token", part: "value", prefix: "" },
      { scheme: "orgApiKey", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
