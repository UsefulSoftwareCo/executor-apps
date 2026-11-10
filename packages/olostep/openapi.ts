import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Olostep product, eleven official specs published at https://docs.olostep.com/openapi/<name>.json, all on
// https://api.olostep.com. index.ts mounts each under its own key. The billing spec's top-up purchase endpoint
// is approval-gated like every mutation.
const spec = (name: string) => ({
  url: `https://docs.olostep.com/openapi/${name}.json`,
});

const credentials = {
  allowedOrigin: "https://api.olostep.com",
  securitySchemes: { Authorization: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "Authorization", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const make = (name: string) => ({ source: spec(name), ...credentials }) satisfies OpenapiToolNamesOptions;

export const scrapesOptions = make("scrapes");
export const batchesOptions = make("batches");
export const crawlsOptions = make("crawls");
export const mapsOptions = make("maps");
export const answersOptions = make("answers");
export const searchOptions = make("search");
export const monitorsOptions = make("monitors");
export const filesOptions = make("files");
export const schedulesOptions = make("schedules");
export const utilityOptions = make("utility");
export const billingOptions = make("billing");

// scripts/tools.ts reads `options`; the scrapes spec is the main one.
export const options = scrapesOptions;
