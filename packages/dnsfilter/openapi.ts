import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.dnsfilter.com/docs/api.json" },
  allowedOrigin: "https://api.dnsfilter.com",
  securitySchemes: { header_authorization: { type: "apiKey", in: "header", name: "Authorization" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ header_authorization: [] }],
  methods: { apiKey: [{ scheme: "header_authorization", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
