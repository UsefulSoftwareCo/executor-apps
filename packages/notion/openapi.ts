import type { OpenapiToolNamesOptions } from "apps/openapi";
import emptySecurity from "./empty-security.json" with { type: "json" };

// Notion's own OpenAPI document, published in the makenotion/notion-mcp-server repository, pinned to
// a commit so the patches below always match it. The document requires bearerAuth at its top level but
// marks 23 of its 24 operations `security: []` (no authentication), so no token would be sent and
// Notion would answer 401. empty-security.json lists them (scripts/empty-security.ts); the patches give
// each one the bearer requirement back.
export const options = {
  source: {
    url: "https://raw.githubusercontent.com/makenotion/notion-mcp-server/9a8a94cdfaaaac98fa5a7023ad76257bbd26ed3e/scripts/notion-openapi.json",
  },
  patches: emptySecurity.map((operation) => ({
    op: "add" as const,
    path: `${operation}/security`,
    value: [{ bearerAuth: [] }],
  })),
  kinds: { "post-search": "query", "query-data-source": "query" },
  allowedOrigin: "https://api.notion.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
