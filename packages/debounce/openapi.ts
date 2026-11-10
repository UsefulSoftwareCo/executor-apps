import type { OpenapiToolNamesOptions } from "apps/openapi";

// DeBounce publishes three official OpenAPI documents (https://developers.debounce.com/llms.txt), one per
// origin. index.ts mounts each under its own key in a single router.
const securitySchemes = { ApiKeyQuery: { type: "apiKey", in: "query", name: "api" } } as const;
const methods = { apiKey: [{ scheme: "ApiKeyQuery", field: "token", part: "value", prefix: "" }] } as const;

export const validationOptions = {
  source: { url: "https://developers.debounce.com/api-reference/openapi-validation.json" },
  allowedOrigin: "https://api.debounce.io",
  securitySchemes,
  methods,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const bulkOptions = {
  source: { url: "https://developers.debounce.com/api-reference/openapi-bulk.json" },
  allowedOrigin: "https://bulk.debounce.io",
  securitySchemes,
  methods,
  oauth: [],
  // Upload is a GET, but it starts a job that spends credits, so it needs approval.
  kinds: { uploadBulkList: "mutation" },
} satisfies OpenapiToolNamesOptions;

// Public endpoint: no API key.
export const disposableOptions = {
  source: { url: "https://developers.debounce.com/api-reference/openapi-disposable.json" },
  allowedOrigin: "https://disposable.debounce.io",
  securitySchemes,
  methods,
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const options = validationOptions;
