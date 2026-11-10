import type { OpenapiToolNamesOptions } from "apps/openapi";

// One bunny.net product, five official specs, four on api.bunny.net and one on logging.bunnycdn.com, all all authenticated with the account
// API key in the AccessKey header. The Stream API (video.bunnycdn.com) and Edge Storage API use per-library
// and per-zone keys instead of the account key, so they are not mounted here.
const credentials = {
  securitySchemes: { AccessKey: { type: "apiKey", in: "header", name: "AccessKey" } },
  fallbackSecurity: [{ AccessKey: [] }],
  methods: { apiKey: [{ scheme: "AccessKey", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const api = (url: string, baseUrl: string, allowedOrigin = "https://api.bunny.net") =>
  ({ source: { url }, allowedOrigin, baseUrl, ...credentials }) satisfies OpenapiToolNamesOptions;

export const coreOptions = api("https://core-api-public-docs.b-cdn.net/docs/v3/public.json", "https://api.bunny.net");
export const computeOptions = api("https://core-api-public-docs.b-cdn.net/docs/v3/compute.json", "https://api.bunny.net");
export const shieldOptions = api("https://api.bunny.net/shield/docs/v1/swagger.json", "https://api.bunny.net");
export const magicContainersOptions = api("https://api-mc.opsbunny.net/docs/public/swagger.json", "https://api.bunny.net/mc");
// CDN Logging is a separate host that takes the same account AccessKey.
export const loggingOptions = api("https://logging.bunnycdn.com/docs/all/swagger.json", "https://logging.bunnycdn.com", "https://logging.bunnycdn.com");

// scripts/tools.ts reads `options`; the Core API is the main one.
export const options = coreOptions;

export const apis = {
  core: coreOptions,
  compute: computeOptions,
  shield: shieldOptions,
  magicContainers: magicContainersOptions,
  logging: loggingOptions,
} as const;
