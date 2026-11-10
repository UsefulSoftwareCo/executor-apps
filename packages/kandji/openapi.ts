import type { OpenapiToolNamesOptions } from "apps/openapi";

// Kandji (now Iru Endpoint Management) is hosted per tenant (<subdomain>.api.kandji.io, or
// <subdomain>.api.eu.kandji.io in the EU). index.ts swaps in the account's origin; the document is the
// same for every tenant. Official document linked from https://docs.iru.com/llms.txt.
export const placeholderOrigin = "https://your-subdomain.api.kandji.io";

export const options = {
  source: { url: "https://docs.iru.com/openapi/iru-endpoint-openapi.json" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
