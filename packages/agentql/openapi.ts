import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec publishes every operation twice. The vendor docs only document the /v1 paths, so the
// unversioned duplicates are removed rather than doubling the tools and approval surface.
const patches = [
  { op: "remove", path: "/paths/~1query-data" },
  { op: "remove", path: "/paths/~1usage" },
  { op: "remove", path: "/paths/~1tetra~1sessions" },
  { op: "remove", path: "/paths/~1tetra~1usage" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.agentql.com/openapi.json" },
  baseUrl: "https://api.agentql.com",
  allowedOrigin: "https://api.agentql.com",
  securitySchemes: { APIKeyHeader: { type: "apiKey", name: "X-API-Key", in: "header" } },
  methods: { apiKey: [{ scheme: "APIKeyHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;
