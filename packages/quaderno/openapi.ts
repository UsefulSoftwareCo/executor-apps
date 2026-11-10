import type { OpenapiToolNamesOptions } from "apps/openapi";

// Quaderno hosts every account at https://<account>.quadernoapp.com/api. index.ts swaps in the account's origin.
export const placeholderOrigin = "https://account.quadernoapp.com";

export const options = {
  source: { url: "https://developers.quaderno.io/redocusaurus/openapi-v20241028.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api`,
  securitySchemes: { "API key": { type: "http", scheme: "basic" } },
  methods: {
    apiKey: [
      { scheme: "API key", field: "token", part: "username", prefix: "" },
      // The API key is the Basic username; the password stays blank. index.ts supplies the empty derived field.
      { scheme: "API key", field: "basicPassword", part: "password", prefix: "" },
    ],
  },
  // The published document says openapi "3.1", which the importer rejects; the intended version is 3.1.0.
  patches: [{ op: "replace", path: "/openapi", value: "3.1.0" }],
  oauth: [],
} satisfies OpenapiToolNamesOptions;
