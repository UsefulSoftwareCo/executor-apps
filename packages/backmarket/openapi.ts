import type { OpenapiToolNamesOptions } from "apps/openapi";

// Back Market's official seller API document (the one rendered at https://api.backmarket.dev). It lists six
// servers (production and preprod for the EU, North America and Asia-Pacific); each account picks its own host in
// index.ts, so the placeholder below is only used to compile the document.
export const placeholderOrigin = "https://www.backmarket.com";

export const options = {
  source: { url: "https://api.backmarket.dev/bundled_openapi.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  // The token created in the back office is sent as `Authorization: Basic <token>`.
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ ApiKeyAuth: [] }],
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "Basic " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
