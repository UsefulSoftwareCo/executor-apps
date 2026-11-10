import type { OpenapiToolNamesOptions } from "apps/openapi";

// Quickbase's own document (the one its API portal serves for download) declares no security
// scheme: every operation takes `QB-Realm-Hostname`, `Authorization` and `User-Agent` as header
// parameters. The router fills them from the account (see index.ts parameterDefaults).
export const options = {
  source: { url: "https://developer.quickbase.com/qb-openapi-v3.json" },
  allowedOrigin: "https://api.quickbase.com",
  securitySchemes: {},
  methods: {},
  oauth: [],
} satisfies OpenapiToolNamesOptions;
