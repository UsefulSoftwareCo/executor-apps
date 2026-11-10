import type { OpenapiToolNamesOptions } from "apps/openapi";

export const dataCenters = {
  us: "https://api.iterable.com",
  eu: "https://api.eu.iterable.com",
} as const;
export type DataCenter = keyof typeof dataCenters;

// Iterable's Swagger 2.0 document declares an `api_key` header scheme and applies it through a
// top-level `security: [{ api_key: [] }]`; no operation carries its own `security`. The compiler
// honors that top-level requirement (every tool is already bound to the API key without
// `fallbackSecurity`), so `fallbackSecurity` below only restates it explicitly.
//
// Each data center serves its own copy of the document and its own API: the US project host is
// api.iterable.com and the EU one is api.eu.iterable.com.
export function optionsFor(dataCenter: DataCenter) {
  const origin = dataCenters[dataCenter];
  return {
    source: { url: `${origin}/api-docs` },
    baseUrl: origin,
    allowedOrigin: origin,
    securitySchemes: { api_key: { type: "apiKey", name: "Api-Key", in: "header" } },
    fallbackSecurity: [{ api_key: [] }],
    methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
    oauth: [],
    // These POST endpoints only render a preview; they change nothing in the project.
    kinds: { previewEmailTemplate: "query", previewInAppTemplate: "query" },
  } satisfies OpenapiToolNamesOptions;
}

export const options = optionsFor("us");
