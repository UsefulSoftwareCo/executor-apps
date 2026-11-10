import type { OpenapiToolNamesOptions } from "apps/openapi";

// GoDaddy's official Domains specs, all served from api.godaddy.com with a Personal Access Token.
// v3 is not mounted: its document is bundled with #/x-ext references that Executor cannot resolve yet.
const credentials = {
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const api = (version: string) =>
  ({
    source: { url: `https://developer.godaddy.com/openapi/domains-${version}.json` },
    allowedOrigin: "https://api.godaddy.com",
    ...credentials,
  }) satisfies OpenapiToolNamesOptions;

export const v2Options = api("v2");
export const v1Options = api("v1");

// scripts/tools.ts reports the first export called options.
export const options = v2Options;
