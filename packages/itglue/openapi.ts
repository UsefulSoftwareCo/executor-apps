import type { OpenapiToolNamesOptions } from "apps/openapi";

// IT Glue is hosted per data center (api, api.eu, api.au); index.ts swaps in the account's origin.
export const placeholderOrigin = "https://api.itglue.com";

export const options = {
  // Community OpenAPI conversion of IT Glue's official Apipie docs (https://api.itglue.com/developer/).
  // IT Glue publishes no OpenAPI document of its own.
  source: { url: "https://raw.githubusercontent.com/jmaddington/ITG-Glue-OpenAPI/main/itgapi.yaml" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
