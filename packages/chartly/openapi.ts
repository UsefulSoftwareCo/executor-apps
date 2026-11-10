import type { OpenapiToolNamesOptions } from "apps/openapi";

// Chartly's published document also lists signup, Stripe webhook, Google OAuth and
// Zapier-only routes. They are not part of the chart API, so they are removed.
const excluded = [
  "/signup/anon",
  "/billing/webhook",
  "/auth/oauth/google",
  "/auth/oauth/google/callback",
  "/v1/zapier/bar-chart",
  "/v1/zapier/line-chart",
  "/v1/zapier/pie-chart",
  "/v1/zapier/multi-series-chart",
];

export const options = {
  source: { url: "https://api.chartly.dev/openapi.json" },
  allowedOrigin: "https://api.chartly.dev",
  baseUrl: "https://api.chartly.dev",
  securitySchemes: {
    api_key: { type: "apiKey", name: "X-Api-Key", in: "header" },
  },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ api_key: [] }],
  methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches: [
    ...excluded.map((path) => ({ op: "remove" as const, path: `/paths/${path.replaceAll("/", "~1")}` })),
    // Public operations keep no security (catalog/status/chartly.json "credentialFree" says why).
    { op: "add", path: "/paths/~1v1~1status/get/security", value: [] },
    { op: "add", path: "/paths/~1v1~1open~1chart/get/security", value: [] },
    { op: "add", path: "/paths/~1v1~1chart~1{id}/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
