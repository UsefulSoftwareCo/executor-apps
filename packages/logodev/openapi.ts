import type { OpenapiToolNamesOptions } from "apps/openapi";

// Only the api.logo.dev JSON operations are exposed. The img.logo.dev image CDN (publishable
// key, image responses) and the private-beta Transaction API (www.logo.dev/api, separate key)
// sit on other hosts and are removed.
const removed = [
  "~1{domain}",
  "~1name~1{brand}",
  "~1ticker~1{ticker}",
  "~1isin~1{isin}",
  "~1crypto~1{symbol}",
  "~1exchange~1{exchange}",
  "~1index~1{symbol}",
  "~1transaction",
];

export const options = {
  source: { url: "https://www.logo.dev/docs/openapi.json" },
  allowedOrigin: "https://api.logo.dev",
  securitySchemes: { secretKey: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "secretKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: removed.map((path) => ({ op: "remove" as const, path: `/paths/${path}` })),
} satisfies OpenapiToolNamesOptions;
