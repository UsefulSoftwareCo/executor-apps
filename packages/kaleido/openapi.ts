import type { OpenapiToolNamesOptions } from "apps/openapi";
import platformDocument from "./platform.json" with { type: "json" };

// platform.json is the OpenAPI document Kaleido embeds in its API reference
// (https://api.kaleido.io/platform.html), which publishes no standalone spec URL.
export const options = {
  source: { document: platformDocument as never },
  allowedOrigin: "https://console.kaleido.io",
  securitySchemes: { bearer_token: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ bearer_token: [] }],
  methods: { apiKey: [{ scheme: "bearer_token", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
