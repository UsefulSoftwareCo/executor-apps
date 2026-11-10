import type { OpenapiToolNamesOptions } from "apps/openapi";

// Brex publishes one OpenAPI document per API on its developer portal, all served from
// https://api.brex.com. Each becomes its own router. The onboarding (partner referrals,
// client credentials) document is left out.
const root = "https://developer.brex.com/_bundle/openapi";

const specs = {
  team: "team_api.yaml",
  transactions: "transactions_api.yaml",
  payments: "payments_api.yaml",
  budgets: "budgets_api.yaml",
  expenses: "expenses_api.yaml",
  fields: "fields_api.yaml",
  accounting: "accounting_api.yaml",
  travel: "travel_api.yaml",
  webhooks: "webhooks_api.yaml",
} as const;

// A user token and an OAuth access token are both sent as a bearer token. The documents name
// their OAuth schemes differently, so each is declared as a bearer scheme.
const schemeNames = ["bearer", "OAuth2", "oauth2", "oAuth2ClientCredentials"];

const common = {
  allowedOrigin: "https://api.brex.com",
  securitySchemes: Object.fromEntries(
    schemeNames.map((name) => [name, { type: "http", scheme: "bearer" }]),
  ),
  fallbackSecurity: [{ bearer: [] }],
  methods: {
    token: schemeNames.map((scheme) => ({ scheme, field: "token", part: "value" as const, prefix: "" })),
    oauth: schemeNames.map((scheme) => ({
      scheme,
      field: "access_token",
      part: "value" as const,
      prefix: "",
    })),
  },
  oauth: [],
} satisfies Omit<OpenapiToolNamesOptions, "source">;

export const sources: Record<string, OpenapiToolNamesOptions> = Object.fromEntries(
  Object.entries(specs).map(([key, file]) => [key, { ...common, source: { url: `${root}/${file}` } }]),
);

// scripts/tools.ts checks this one.
export const options = sources.team satisfies OpenapiToolNamesOptions;
