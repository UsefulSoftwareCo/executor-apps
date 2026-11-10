import type { OpenapiToolNamesOptions } from "apps/openapi";

// Synthflow serves the same API from three regional hosts; a workspace uses the one for its region
// (https://docs.synthflow.ai/getting-started-with-your-api). index.ts pins the account's own region.
export const regions = {
  global: "https://api.synthflow.ai",
  us: "https://api.us.synthflow.ai",
  eu: "https://api.eu.synthflow.ai",
} as const;

export const options = {
  source: { url: "https://docs.synthflow.ai/openapi.json" },
  allowedOrigin: regions.global,
  baseUrl: `${regions.global}/v2`,
  securitySchemes: { sec0: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ sec0: [] }],
  methods: { apiKey: [{ scheme: "sec0", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
