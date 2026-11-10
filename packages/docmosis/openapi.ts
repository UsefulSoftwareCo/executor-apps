import type { OpenapiToolNamesOptions } from "apps/openapi";

// Docmosis Cloud is hosted per region (us1, eu1, au1); index.ts swaps in the account's origin.
export const placeholderOrigin = "https://us1.dws4.docmosis.com";

export const options = {
  source: { url: "https://us1.dws4.docmosis.com/api/openapi.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: `${placeholderOrigin}/api`,
  securitySchemes: { accessKeyAuthorization: { type: "apiKey", in: "header", name: "accessKey" } },
  methods: { apiKey: [{ scheme: "accessKeyAuthorization", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
