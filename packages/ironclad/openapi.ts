import type { OpenapiToolNamesOptions } from "apps/openapi";

// Ironclad's official Public API description (OpenAPI 3.1). Every operation lists the apiKey scheme "sec0" (a bearer
// token in Authorization) together with the OAuth2 scheme; both carry the same bearer token, so one scheme is declared.
// The server is chosen per account: ironcladapp.com (NA), eu1.ironcladapp.com or demo.ironcladapp.com.
const regionHosts = {
  na1: "https://na1.ironcladapp.com",
  eu1: "https://eu1.ironcladapp.com",
  demo: "https://demo.ironcladapp.com",
} as const;

export type Region = keyof typeof regionHosts;

export const publicApiOptions = (region: Region) =>
  ({
    source: { url: "https://developer.ironcladapp.com/openapi/ironclad-public-api.json" },
    allowedOrigin: regionHosts[region],
    baseUrl: `${regionHosts[region]}/public/api/v1`,
    securitySchemes: {
      sec0: { type: "apiKey", in: "header", name: "Authorization" },
      OAuth2: { type: "http", scheme: "bearer" },
    },
    methods: {
      apiKey: [
        { scheme: "sec0", field: "token", part: "value", prefix: "Bearer " },
        { scheme: "OAuth2", field: "token", part: "value", prefix: "" },
      ],
      oauth: [
        { scheme: "sec0", field: "access_token", part: "value", prefix: "Bearer " },
        { scheme: "OAuth2", field: "access_token", part: "value", prefix: "" },
      ],
      oauthEu: [
        { scheme: "sec0", field: "access_token", part: "value", prefix: "Bearer " },
        { scheme: "OAuth2", field: "access_token", part: "value", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

// scripts/tools.ts checks this export.
export const options = publicApiOptions("na1");
