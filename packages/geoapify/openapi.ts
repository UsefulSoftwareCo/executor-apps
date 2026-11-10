import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Geoapify product, many official specs from https://github.com/geoapify/geoapify-openapi-specs
// (served at apidocs.geoapify.com). index.ts mounts each under its own key. The API key goes in the
// documented `x-api-key` header, never the query string.
const spec = (name: string) => ({ url: `https://apidocs.geoapify.com/assets/openapi/specs/${name}` });

const credentials = {
  securitySchemes: {
    ApiKeyInHeader: { type: "apiKey", in: "header", name: "x-api-key" },
  },
  methods: { apiKey: [{ scheme: "ApiKeyInHeader", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const api = <const K extends Record<string, "query">>(path: string, origin: string, kinds: K) =>
  ({ source: spec(path), allowedOrigin: new URL(origin).origin, ...credentials, kinds }) satisfies OpenapiToolNamesOptions;

const v1 = "https://api.geoapify.com/v1";
const v2 = "https://api.geoapify.com/v2";
const maps = "https://maps.geoapify.com/v1";

// POST operations that only compute or search are kinds=query, so they run without an approval prompt.
export const apis = {
  geocoding: api("forward-geocoding/forward-geocoding-api-openapi-specs.json", v1, {}),
  reverseGeocoding: api("reverse-geocoding/reverse-geocoding-api-openapi-specs.json", v1, {}),
  autocomplete: api("address-autocomplete/address-autocomplete-api-openapi-specs.json", v1, {}),
  batchGeocoding: api("batch-geocoding/batch-geocoding-api-openapi-specs.json", v1, {}),
  batch: api("batch/batch-api-openapi-specs.json", v1, {}),
  places: api("places/places-api-openapi-specs.json", v2, { searchPlacesPost: "query" }),
  placeDetails: api("place-details/place-details-api-openapi-specs.json", v2, {}),
  placeInfo: api("place-info/place-info-api-openapi-specs.json", v2, {}),
  routing: api("routing/routing-api-openapi-specs.json", v1, {}),
  routeMatrix: api("route-matrix/route-matrix-api-openapi-specs.json", v1, { calculateRouteMatrix: "query" }),
  routePlanner: api("route-planner/route-planner-api-openapi-specs.json", v1, { planRoutes: "query" }),
  isolines: api("isoline/isoline-api-openapi-specs.json", v1, {}),
  mapMatching: api("map-matching/map-matching-api-openapi-specs.json", v1, { matchGpsTrace: "query" }),
  boundaries: api("boundaries/boundaries-api-openapi-specs.json", v1, {}),
  postcode: api("postcode/postcode-api-openapi-specs.json", v1, {}),
  elevation: api("elevation/elevation-api-openapi-specs.json", v1, { getElevations: "query" }),
  ipGeolocation: api("ip-geolocation/ip-geolocation-api-openapi-specs.json", v1, {}),
  geometry: api("geometry/geometry-api-openapi-specs.json", v1, {}),
  geometryOperations: api("geometry-operations/geometry-operations-api-openapi-specs.json", v1, {
    performGeometryOperation: "query",
  }),
  mapTiles: api("map-tiles/map-tiles-api-openapi-specs.json", maps, {}),
  staticMaps: api("static-maps/static-maps-api-openapi-specs.json", maps, { postStaticMap: "query" }),
  mapMarker: api("map-marker/map-marker-api-openapi-specs.json", v2, {}),
} as const;

// scripts/tools.ts reads `options`.
export const options = apis.geocoding;
