import type { OpenapiToolNamesOptions } from "apps/openapi";
import document from "./document.json" with { type: "json" };

// evaluagent is hosted per region (EU, US-East, Australia); index.ts swaps in the account's origin.
export const placeholderOrigin = "https://api.evaluagent.com";

export const options = {
  source: { document: document as never },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/v1`,
  securitySchemes: { Basic: { type: "http", scheme: "basic" } },
  // The Access Key ID is the Basic username and the Secret Key the password.
  methods: {
    apiKey: [
      { scheme: "Basic", field: "accessKeyId", part: "username", prefix: "" },
      { scheme: "Basic", field: "secretKey", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
