import type { OpenapiToolNamesOptions } from "apps/openapi";

// Certn publishes the CertnCentric OpenAPI document at the docs site. It declares no servers: every region
// (ca, uk, au) has its own origin and its own API keys, so the account's region picks the base URL.
export const regions = ["ca", "uk", "au"] as const;
export type Region = (typeof regions)[number];

export const options = {
  source: { url: "https://centric-api-docs.certn.co/openapi.yaml" },
  allowedOrigin: "https://api.ca.certn.co",
  baseUrl: "https://api.ca.certn.co",
  securitySchemes: { tokenAuth: { type: "apiKey", in: "header", name: "Authorization" } },
  methods: { apiKey: [{ scheme: "tokenAuth", field: "apiKey", part: "value", prefix: "Api-Key " }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

export const regionalOptions = (region: Region) =>
  ({
    ...options,
    allowedOrigin: `https://api.${region}.certn.co`,
    baseUrl: `https://api.${region}.certn.co`,
  }) satisfies OpenapiToolNamesOptions;
