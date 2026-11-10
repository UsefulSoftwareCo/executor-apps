import type { OpenapiToolNamesOptions } from "apps/openapi";

// ROLLER publishes the bundled (references resolved) export of its REST and Reporting API documents on its developer portal (docs.roller.app, hosted on
// Stoplight). Both declare an OAuth 2.0 client-credentials scheme whose token endpoint takes a JSON body, which the
// generic oauth2 grant cannot send, so index.ts mints the bearer token and swaps it in with a fetch wrapper.
const base = {
  allowedOrigin: "https://api.roller.app",
  securitySchemes: { OAuth2: { type: "http", scheme: "bearer" } },
  methods: { clientCredentials: [{ scheme: "OAuth2", field: "clientId", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const spec = (name: string) => ({
  url: `https://api.stoplight.io/projects/cHJqOjMxNDQ5NA/branches/master/export/reference/${name}.yaml`,
});

export const restOptions = { ...base, source: spec("rest-api") } satisfies OpenapiToolNamesOptions;
export const reportingOptions = { ...base, source: spec("reporting-api") } satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`.
export const options = restOptions;
