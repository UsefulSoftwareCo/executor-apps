import type { OpenapiToolNamesOptions } from "apps/openapi";

// One product, seven official specs published at https://you.com/docs/openapi.json (index) and
// https://you.com/docs/openapi/<name>.json. Search and Contents live on ydc-index.io; the rest on api.you.com.
const credentials = {
  securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
  methods: { apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const api = <const K extends Record<string, "query">>(name: string, origin: string, kinds: K) =>
  ({
    source: { url: `https://you.com/docs/openapi/${name}.json` },
    allowedOrigin: origin,
    ...credentials,
    kinds,
  }) satisfies OpenapiToolNamesOptions;

// POST operations that only read are kinds=query, so they run without an approval prompt.
export const searchOptions = api("web-search", "https://ydc-index.io", { searchPost: "query" });
export const contentsOptions = api("contents", "https://ydc-index.io", { contents: "query" });
export const answerOptions = api("answer", "https://api.you.com", {});
export const researchOptions = api("research", "https://api.you.com", {});
export const financeResearchOptions = api("finance-research", "https://api.you.com", {});
export const billingOptions = api("billing", "https://api.you.com", {});
export const imagesOptions = api("images", "https://api.you.com", {});

export const apis = {
  search: searchOptions,
  contents: contentsOptions,
  answer: answerOptions,
  research: researchOptions,
  financeResearch: financeResearchOptions,
  billing: billingOptions,
  images: imagesOptions,
} as const;

// scripts/tools.ts reads `options`.
export const options = searchOptions;
