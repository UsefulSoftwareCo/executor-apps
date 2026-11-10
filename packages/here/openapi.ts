// HERE Technologies is one product served from many hosts, so each API is its own document mounted under its own
// key in index.ts. The documents are the official OpenAPI definitions embedded in the HERE developer documentation
// (https://docs.here.com, one definition per operation page), merged per API with the revision shown in each
// document's info.version. Credentials are the HERE API key, sent as the `apiKey` query parameter.
import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import batch from "./batch-openapi.json" with { type: "json" };
import ev from "./ev-openapi.json" with { type: "json" };
import fuel from "./fuel-openapi.json" with { type: "json" };
import geofencing from "./geofencing-openapi.json" with { type: "json" };
import intermodal from "./intermodal-openapi.json" with { type: "json" };
import isoline from "./isoline-openapi.json" with { type: "json" };
import matrix from "./matrix-openapi.json" with { type: "json" };
import positioning from "./positioning-openapi.json" with { type: "json" };
import routematching from "./routematching-openapi.json" with { type: "json" };
import routing from "./routing-openapi.json" with { type: "json" };
import search from "./search-openapi.json" with { type: "json" };
import tourplanning from "./tourplanning-openapi.json" with { type: "json" };
import traffic from "./traffic-openapi.json" with { type: "json" };
import transit from "./transit-openapi.json" with { type: "json" };
import waypoints from "./waypoints-openapi.json" with { type: "json" };
import weather from "./weather-openapi.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const widen = (value: unknown): JsonObject => JSON.parse(JSON.stringify(value));

// The documents name the API key scheme "ApiKey" or "apiKey"; the scheme must match the document's own.
const credentials = <const S extends string>(scheme: S, param: string) =>
  ({
    securitySchemes: { [scheme]: { type: "apiKey", in: "query", name: param } },
    methods: { apiKey: [{ scheme, field: "apiKey", part: "value", prefix: "" }] },
    oauth: [],
  }) as const;

const api = <const K extends Record<string, "query" | "mutation">>(
  document: unknown,
  origin: string,
  kinds: K,
  scheme: "ApiKey" | "apiKey" = "ApiKey",
  param = "apiKey",
) =>
  ({
    ...credentials(scheme, param),
    source: { document: widen(document) },
    allowedOrigin: origin,
    kinds,
  }) satisfies OpenapiToolNamesOptions;

// Geocoding and Search v7 serves every endpoint from its own host, so the document is cut into one per endpoint.
const searchEndpoint = <const K extends Record<string, "query" | "mutation">>(path: string, host: string, kinds: K) => {
  const document = widen(search);
  const paths = document.paths as Record<string, unknown>;
  for (const key of Object.keys(paths)) if (key !== path) delete paths[key];
  return api(document, `https://${host}.search.hereapi.com`, kinds);
};

// Kinds are keyed by the document's operationId (or the generated tool name when an operation has none), because that
// is what the framework looks up. POST operations that only read or compute are queries, so they run without an
// approval prompt; everything else that is not a GET asks for approval. GET operations are queries unless listed here.
export const geocodeOptions = searchEndpoint("/geocode", "geocode", {});
export const reverseGeocodeOptions = searchEndpoint("/revgeocode", "revgeocode", {});
export const multiReverseGeocodeOptions = searchEndpoint("/multi-revgeocode", "multi-revgeocode", { "multiRevgeocode.postMultiRevgeocode": "query" });
export const autosuggestOptions = searchEndpoint("/autosuggest", "autosuggest", { "autosuggest.postAutosuggest": "query" });
export const autocompleteOptions = searchEndpoint("/autocomplete", "autocomplete", {});
export const browseOptions = searchEndpoint("/browse", "browse", { "browse.postBrowse": "query" });
export const discoverOptions = searchEndpoint("/discover", "discover", { "discover.postDiscover": "query" });
export const lookupOptions = searchEndpoint("/lookup", "lookup", {});
export const routingOptions = api(routing, "https://router.hereapi.com", {
  "Routing API v8 calculateRoutesPost": "query",
  "Routing API v8 getRoutesByHandlePost": "query",
  "Routing API v8 importRoute": "query",
});
export const isolineOptions = api(isoline, "https://isoline.router.hereapi.com", {
  "Isoline Routing API v8 calculateIsolinesPost": "query",
});
// postMatrix creates a calculation job, so it keeps its approval prompt.
export const matrixOptions = api(matrix, "https://matrix.router.hereapi.com", {});
export const waypointsOptions = api(waypoints, "https://wps.hereapi.com", { "Waypoints Sequence API findSequencePOST": "query" }, "apiKey");
export const routeMatchingOptions = api(
  routematching,
  "https://routematching.hereapi.com",
  { "HERE Route Matching V8 API matchRouteV8compatibilityToV2POST": "query" },
  "apiKey",
);
export const geofencingOptions = api(
  geofencing,
  "https://geofencing.hereapi.com",
  {
    "Geofencing API geofencePost": "query",
    // A GET that deletes layers and maps.
    "Geofencing API v8DeleteMapsLayers": "mutation",
  },
  "apiKey",
);
export const trafficOptions = api(traffic, "https://data.traffic.hereapi.com", {
  "Traffic API v7 getFlowWithBodyParams": "query",
  "Traffic API v7 getIncidentsWithBodyParams": "query",
  "Traffic API v7 getIncidentsByIdWithBodyParams": "query",
});
export const weatherOptions = api(weather, "https://weather.hereapi.com", { "Weather API v3 weatherAlert": "query" });
export const transitOptions = api(transit, "https://transit.hereapi.com", {});
export const intermodalOptions = api(intermodal, "https://intermodal.router.hereapi.com", {});
export const fuelOptions = api(fuel, "https://fuel.hereapi.com", { "Fuel Prices API v3 fuelStationsCorridorSearch": "query" });
export const evOptions = api(ev, "https://evcp.hereapi.com", {});
export const positioningOptions = api(positioning, "https://positioning.hereapi.com", {
  "HERE Network Positioning API v2 postLocate": "query",
});
// Tour planning's synchronous solve has no operationId, so it is keyed by its generated tool name.
export const tourPlanningOptions = api(
  tourplanning,
  "https://tourplanning.hereapi.com",
  { "synchronous.postProblems": "query" },
  "ApiKey",
  "apikey",
);
export const batchOptions = api(batch, "https://batch.search.hereapi.com", {});

// scripts/tools.ts reads `options`; Geocoding and Search is the main API.
export const options = geocodeOptions;

export const apis = {
  geocode: geocodeOptions,
  reverseGeocode: reverseGeocodeOptions,
  multiReverseGeocode: multiReverseGeocodeOptions,
  autosuggest: autosuggestOptions,
  autocomplete: autocompleteOptions,
  browse: browseOptions,
  discover: discoverOptions,
  lookup: lookupOptions,
  routing: routingOptions,
  isoline: isolineOptions,
  matrix: matrixOptions,
  waypoints: waypointsOptions,
  routeMatching: routeMatchingOptions,
  geofencing: geofencingOptions,
  traffic: trafficOptions,
  weather: weatherOptions,
  transit: transitOptions,
  intermodal: intermodalOptions,
  fuel: fuelOptions,
  evChargePoints: evOptions,
  positioning: positioningOptions,
  tourPlanning: tourPlanningOptions,
  batch: batchOptions,
} as const;

// Guards the approval classification at load time (the framework silently ignores a kinds key that matches no
// operation, and a GET whose id or summary says it deletes or modifies must be declared a mutation). Keys are the
// document's operationId; the few operations without one are keyed by generated tool name (contain a "."), which
// only kinds-check.ts can verify.
const destructive = /\b(delete|remove|modify|purge|destroy)/i;
type Doc = { paths: Record<string, Record<string, { operationId?: string; summary?: string }>> };
for (const [mount, options] of Object.entries(apis)) {
  const paths = (options.source.document as Doc).paths;
  const ids = new Set<string>();
  for (const item of Object.values(paths)) for (const op of Object.values(item)) if (op.operationId !== undefined) ids.add(op.operationId);
  const kinds = options.kinds as Record<string, string>;
  for (const key of Object.keys(kinds)) {
    if (!ids.has(key) && !key.includes(".")) throw new Error(`here/${mount}: kinds key "${key}" matches no operationId`);
  }
  for (const [path, item] of Object.entries(paths)) {
    const op = item.get;
    if (op === undefined) continue;
    const id = op.operationId ?? "";
    if (destructive.test(`${id} ${op.summary ?? ""}`) && kinds[id] !== "mutation") {
      throw new Error(`here/${mount}: GET ${path} (${id}) looks destructive but is not a mutation`);
    }
  }
}
