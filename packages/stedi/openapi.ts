import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Stedi product, seven official specs from https://github.com/Stedi/openApi. index.ts mounts each under its
// own key. Stedi's API key goes raw in the Authorization header (no Bearer prefix).
const spec = (name: string) => ({ url: `https://raw.githubusercontent.com/Stedi/openApi/main/${name}.json` });

const credentials = {
  securitySchemes: {
    httpApiKeyAuth: { type: "apiKey", in: "header", name: "Authorization" },
    httpApiKeyAuthTestEnabled: { type: "apiKey", in: "header", name: "Authorization" },
  },
  methods: {
    apiKey: [
      { scheme: "httpApiKeyAuth", field: "token", part: "value", prefix: "" },
      { scheme: "httpApiKeyAuthTestEnabled", field: "token", part: "value", prefix: "" },
    ],
  },
  oauth: [],
} as const;

const api = (name: string, origin: string) =>
  ({ source: spec(name), allowedOrigin: origin, ...credentials }) satisfies OpenapiToolNamesOptions;

export const healthcareOptions = api("healthcare", "https://healthcare.us.stedi.com");
export const claimsOptions = api("claims", "https://claims.us.stedi.com");
export const batchEligibilityOptions = api("manager", "https://manager.us.stedi.com");
export const enrollmentOptions = api("enrollment", "https://enrollments.us.stedi.com");
export const payersOptions = api("payers", "https://payers.us.stedi.com");
export const eventDestinationsOptions = api("event-destinations", "https://events.us.stedi.com");
export const coreOptions = api("core", "https://core.us.stedi.com");

// scripts/tools.ts reads `options`; healthcare (eligibility and claims) is the main one.
export const options = healthcareOptions;
export const apis = {
  healthcare: healthcareOptions,
  claims: claimsOptions,
  batchEligibility: batchEligibilityOptions,
  enrollment: enrollmentOptions,
  payers: payersOptions,
  eventDestinations: eventDestinationsOptions,
  core: coreOptions,
} as const;
