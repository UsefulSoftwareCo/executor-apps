import type { OpenapiToolNamesOptions } from "apps/openapi";

// Teamwork is hosted per site (<site>.teamwork.com). index.ts swaps in the account's origin.
export const placeholderOrigin = "https://yoursite.teamwork.com";

export const options = {
  // Teamwork's API v3 reference (Swagger 2.0), served from the asset bucket behind apidocs.teamwork.com.
  source: {
    url: "https://contento-assets.s3.eu-west-1.amazonaws.com/oas/teamwork_docs/projects/reference/projects-api-v3.oas2.yml",
  },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // The document declares no security schemes; every operation accepts HTTP Basic.
  securitySchemes: { basic: { type: "http", scheme: "basic" } },
  fallbackSecurity: [{ basic: [] }],
  methods: {
    apiKey: [
      // Docs: Basic `{API_KEY or username}:password` (apidocs.teamwork.com/guides/teamwork/authentication).
      // The key is the username; index.ts supplies the non-secret constant "x" as the password.
      { scheme: "basic", field: "apiKey", part: "username", prefix: "" },
      { scheme: "basic", field: "basicPassword", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
