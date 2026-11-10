import type { OpenapiToolNamesOptions } from "apps/openapi";

// Botpress publishes its official OpenAPI documents in github.com/botpress/docs, which builds
// docs.botpress.com. The Chat API (chat.botpress.cloud) is per-webhook and unauthenticated, so it is left out.
const base = {
  allowedOrigin: "https://api.botpress.cloud",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const spec = (name: string) => ({
  url: `https://raw.githubusercontent.com/botpress/docs/master/${name}-openapi.json`,
});

export const adminOptions = { ...base, source: spec("admin") } satisfies OpenapiToolNamesOptions;
export const runtimeOptions = { ...base, source: spec("runtime") } satisfies OpenapiToolNamesOptions;
export const filesOptions = { ...base, source: spec("files") } satisfies OpenapiToolNamesOptions;
export const tablesOptions = { ...base, source: spec("tables") } satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`; the admin API is the largest surface.
export const options = adminOptions;
