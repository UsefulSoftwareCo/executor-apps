import type { OpenapiToolNamesOptions } from "apps/openapi";
import maps from "./maps.json" with { type: "json" };
import routing from "./routing.json" with { type: "json" };
import search from "./search.json" with { type: "json" };

type Document = Extract<OpenapiToolNamesOptions["source"], { document: unknown }>["document"];

// One TomTom product, three documents: TomTom's own API Explorer OpenAPI files
// (https://docs.tomtom.com/assets/openapi/), committed by scripts/vendor-openapi.ts because they are
// not advertised downloads and may move. search.json joins the Search, Geocoding and Reverse
// Geocoding files, which used to be one Search API. Each file records its sources in
// info.x-executor-source. All use the `key` query parameter.
const api = <const K extends Record<string, "query">>(document: object, kinds: K) =>
  ({
    source: { document: document as unknown as Document },
    allowedOrigin: "https://api.tomtom.com",
    securitySchemes: { api_key: { type: "apiKey", in: "query", name: "key" } },
    methods: { apiKey: [{ scheme: "api_key", field: "token", part: "value", prefix: "" }] },
    oauth: [],
    // POST operations that only compute a result are queries, so they run without an approval prompt.
    kinds,
  }) satisfies OpenapiToolNamesOptions;

export const mapsOptions = api(maps, {});
export const routingOptions = api(routing, { "routing.postCalculateRoute": "query" });
export const searchOptions = api(search, {
  "filters.postSearchGeometryFilterExt": "query",
  "search.postGeometrySearch": "query",
  "filters.postSearchRoutedFilter": "query",
  "search.postSearchAlongRoute": "query",
});

// scripts/tools.ts reads `options`; the Search API is the main one.
export const options = searchOptions;
