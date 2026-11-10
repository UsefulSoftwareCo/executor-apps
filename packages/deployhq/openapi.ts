import type { OpenapiToolNamesOptions } from "apps/openapi";

// DeployHQ is hosted per account (<account>.deployhq.com). index.ts swaps in the account's origin.
export const placeholderOrigin = "https://account.deployhq.com";

export const options = {
  source: { url: "https://api.deployhq.com/docs.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { basic: { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "basic", field: "email", part: "username", prefix: "" },
      { scheme: "basic", field: "apiKey", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
