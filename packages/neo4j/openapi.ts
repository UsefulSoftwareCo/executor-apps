import type { OpenapiToolNamesOptions } from "apps/openapi";

// Neo4j publishes two official Aura API documents. v1 is the stable API (instances, tenants, snapshots,
// customer-managed keys, Graph Analytics sessions); v2beta1 adds organizations, projects, users, invites,
// IP filters, databases and backups, import jobs, billing, agents and fleet manager. Both use the same
// OAuth 2.0 client-credentials bearer token on https://api.neo4j.io. index.ts mounts them as `v1` and `v2beta1`.
const common = {
  allowedOrigin: "https://api.neo4j.io",
  securitySchemes: { oauthToken: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ oauthToken: [] }],
  methods: { clientCredentials: [{ scheme: "oauthToken", field: "access_token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

export const v1Options = {
  ...common,
  source: { url: "https://neo4j.com/docs/aura/platform/api/specification/aura_api_spec_v1.yaml" },
} satisfies OpenapiToolNamesOptions;

export const v2Options = {
  ...common,
  source: { url: "https://api.neo4j.io/v2beta1/spec.json" },
} satisfies OpenapiToolNamesOptions;

export const options = v1Options;
