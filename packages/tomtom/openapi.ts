import type { OpenapiToolNamesOptions } from "apps/openapi";

// One TomTom product, three specs from the APIs.guru conversion of TomTom's published API definitions
// (https://github.com/APIs-guru/openapi-directory/tree/main/APIs/tomtom.com). All use the `key` query parameter.
const api = <const K extends Record<string, "query">>(name: string, kinds: K) =>
  ({
    source: { url: `https://api.apis.guru/v2/specs/tomtom.com/${name}/1.0.0/openapi.json` },
    allowedOrigin: "https://api.tomtom.com",
    securitySchemes: { api_key: { type: "apiKey", in: "query", name: "key" } },
    methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
    oauth: [],
    // POST operations that only compute a result are queries, so they run without an approval prompt.
    kinds,
  }) satisfies OpenapiToolNamesOptions;

export const mapsOptions = api("maps", {});
export const routingOptions = api("routing", {
  "routing.postCalculateReachableRange": "query",
  "routing.postCalculateRoute": "query",
});
export const searchOptions = api("search", {
  "filters.postSearchGeometryFilterExt": "query",
  "search.postGeometrySearch": "query",
  "filters.postSearchRoutedFilter": "query",
  "search.postSearchAlongRoute": "query",
});

// scripts/tools.ts reads `options`; the Search API is the main one.
export const options = searchOptions;
