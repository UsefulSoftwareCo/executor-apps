import type { OpenapiToolNamesOptions } from "apps/openapi";

// KoboToolbox publishes the same API on each server (global, EU) and on self-hosted installs;
// index.ts swaps in the account's origin. The description declares no servers.
export const placeholderOrigin = "https://kf.kobotoolbox.org";

export const options = {
  source: { url: "https://kf.kobotoolbox.org/api/v2/schema/" },
  allowedOrigin: placeholderOrigin,
  baseUrl: placeholderOrigin,
  securitySchemes: { TokenAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "TokenAuth", field: "token", part: "value", prefix: "Token " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
