import type { OpenapiToolNamesOptions } from "apps/openapi";

// Phrase Strings API v2, from the official OpenAPI document in https://github.com/phrase/openapi.
// Accounts live in one of two data centers, each with its own origin; `options` takes the region.
export const regions = {
  eu: "https://api.phrase.com",
  us: "https://api.us.app.phrase.com",
} as const;

export type Region = keyof typeof regions;

export const optionsFor = (region: Region) =>
  ({
    source: { url: "https://raw.githubusercontent.com/phrase/openapi/master/doc/compiled.json" },
    allowedOrigin: regions[region],
    baseUrl: `${regions[region]}/v2`,
    securitySchemes: { Token: { type: "apiKey", in: "header", name: "Authorization" } },
    methods: { apiKey: [{ scheme: "Token", field: "token", part: "value", prefix: "token " }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

// scripts/tools.ts checks this export.
export const options = optionsFor("eu");
