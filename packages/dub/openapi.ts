import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://dub.co/openapi.json" },
  allowedOrigin: "https://api.dub.co",
  securitySchemes: { token: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ token: [] }],
  methods: {
    apiKey: [{ scheme: "token", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "token", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// OAuth scopes (links, tags, domains, folders, analytics) do not cover these paths, so OAuth
// accounts do not get them as tools. API-key accounts keep the full document.
const oauthUncovered = [
  "/bounties/{bountyId}/submissions",
  "/bounties/{bountyId}/submissions/{submissionId}/approve",
  "/bounties/{bountyId}/submissions/{submissionId}/reject",
  "/commissions",
  "/commissions/bulk",
  "/commissions/{id}",
  "/customers",
  "/customers/{id}",
  "/discount-codes",
  "/discount-codes/{idOrCode}",
  "/partners",
  "/partners/analytics",
  "/partners/ban",
  "/partners/deactivate",
  "/partners/links",
  "/partners/links/upsert",
  "/payouts",
  "/program-applications",
  "/program-applications/approve",
  "/program-applications/reject",
  "/tokens/embed/referrals",
  "/track/lead",
  "/track/open",
  "/track/sale",
];

export const oauthOptions = {
  ...options,
  patches: oauthUncovered.map((path) => ({
    op: "remove" as const,
    path: `/paths/${path.replaceAll("~", "~0").replaceAll("/", "~1")}`,
  })),
} satisfies OpenapiToolNamesOptions;
