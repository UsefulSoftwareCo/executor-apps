import type { JsonObject } from "apps";

// Hand-written OpenAPI documents for the Maps Platform web services Google does not publish a machine-readable
// description for: Geocoding, Elevation and Time Zone (maps.googleapis.com), Routes (routes.googleapis.com) and
// Geolocation (www.googleapis.com). Facts come from https://developers.google.com/maps/documentation.
const key = { apiKey: [] as string[] };
const securitySchemes = { apiKey: { type: "apiKey", in: "query", name: "key" } };
const result = { type: "object", additionalProperties: true };
const json = (schema: JsonObject = result) => ({ description: "Success", content: { "application/json": { schema } } });
const q = (name: string, description: string, required = false) => ({
  name,
  in: "query",
  required,
  description,
  schema: { type: "string" },
});
const fieldMask = {
  name: "X-Goog-FieldMask",
  in: "header",
  required: true,
  description:
    "Comma-separated response fields to return, for example `routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline`. Use `*` for all fields (development only).",
  schema: { type: "string" },
};
const body = (description: string, properties: JsonObject, required: string[] = []) => ({
  required: true,
  content: { "application/json": { schema: { type: "object", description, properties, required, additionalProperties: true } } },
});
const object = (description: string) => ({ type: "object", description, additionalProperties: true });
const text = (description: string) => ({ type: "string", description });
const list = (description: string) => ({ type: "array", description, items: { type: "object", additionalProperties: true } });

const waypoint = (what: string) =>
  object(
    `${what} as a Waypoint: one of \`location\` ({ latLng: { latitude, longitude }, heading? }), \`placeId\` or \`address\`, plus optional \`via\`, \`vehicleStopover\` and \`sideOfRoad\`.`,
  );

const routeModifiers = object(
  "RouteModifiers: avoidTolls, avoidHighways, avoidFerries, avoidIndoor, vehicleInfo, tollPasses.",
);

export const geocodingDocument: JsonObject = {
  openapi: "3.0.3",
  info: {
    title: "Google Maps Geocoding, Elevation and Time Zone APIs",
    version: "v3",
    description: "Address and coordinate lookup, elevation and time zones. Responses carry a `status` field; errors still use HTTP 200.",
  },
  servers: [{ url: "https://maps.googleapis.com" }],
  security: [key],
  paths: {
    "/maps/api/geocode/json": {
      get: {
        operationId: "geocode",
        description:
          "Geocodes an address, component filter or Place ID to coordinates, or reverse geocodes `latlng` (or a Place ID) to addresses. Provide at least one of `address`, `components`, `latlng` or `place_id`.",
        parameters: [
          q("address", "Street address or plus code to geocode, for example `1600 Amphitheatre Parkway, Mountain View, CA`."),
          q("latlng", "Latitude and longitude to reverse geocode, comma separated, for example `40.714224,-73.961452`."),
          q("place_id", "Place ID to return the address for."),
          q("components", "Pipe-separated component filters, for example `country:ES|postal_code:08001`."),
          q("bounds", "Bounding box to bias results, `south_west_lat,south_west_lng|north_east_lat,north_east_lng`."),
          q("region", "Region bias as a two-character ccTLD code, for example `uk`."),
          q("language", "Language for returned addresses, for example `en`."),
          q("result_type", "Pipe-separated address types to filter reverse geocoding results by."),
          q("location_type", "Pipe-separated location types to filter reverse geocoding results by: ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE."),
        ],
        responses: { 200: json() },
        security: [key],
      },
    },
    "/maps/api/elevation/json": {
      get: {
        operationId: "elevation",
        description: "Returns the elevation in meters for locations, or sampled along a path. Provide `locations`, or `path` with `samples`.",
        parameters: [
          q("locations", "Pipe-separated `lat,lng` pairs, or `enc:` followed by an encoded polyline."),
          q("path", "Pipe-separated `lat,lng` pairs, or `enc:` followed by an encoded polyline, to sample along."),
          q("samples", "Number of evenly spaced samples along `path`."),
        ],
        responses: { 200: json() },
        security: [key],
      },
    },
    "/maps/api/timezone/json": {
      get: {
        operationId: "timezone",
        description: "Returns the time zone id, name, UTC offset and daylight saving offset for a location at a moment in time.",
        parameters: [
          q("location", "`lat,lng` of the point.", true),
          q("timestamp", "Seconds since midnight UTC, January 1, 1970; selects the daylight saving rules in effect.", true),
          q("language", "Language for the time zone name, for example `en`."),
        ],
        responses: { 200: json() },
        security: [key],
      },
    },
  },
  components: { securitySchemes },
};

export const routesDocument: JsonObject = {
  openapi: "3.0.3",
  info: {
    title: "Google Maps Routes API",
    version: "v2",
    description: "Routes between places, and route matrices, with traffic-aware durations.",
  },
  servers: [{ url: "https://routes.googleapis.com" }],
  security: [key],
  paths: {
    "/directions/v2:computeRoutes": {
      post: {
        operationId: "computeRoutes",
        description:
          "Returns a primary route, and optionally alternatives, between an origin and destination with optional intermediates. `X-Goog-FieldMask` is required.",
        parameters: [fieldMask],
        requestBody: body(
          "ComputeRoutesRequest",
          {
            origin: waypoint("The start"),
            destination: waypoint("The end"),
            intermediates: list("Waypoints to pass through or stop at, in order."),
            travelMode: text("DRIVE, BICYCLE, WALK, TWO_WHEELER or TRANSIT."),
            routingPreference: text("TRAFFIC_UNAWARE, TRAFFIC_AWARE or TRAFFIC_AWARE_OPTIMAL (DRIVE and TWO_WHEELER only)."),
            polylineQuality: text("OVERVIEW or HIGH_QUALITY."),
            polylineEncoding: text("ENCODED_POLYLINE or GEO_JSON_LINESTRING."),
            departureTime: text("RFC 3339 timestamp, for example 2026-10-12T09:00:00Z."),
            arrivalTime: text("RFC 3339 timestamp; TRANSIT only."),
            computeAlternativeRoutes: { type: "boolean", description: "Also return alternative routes." },
            routeModifiers,
            languageCode: text("BCP-47 language code, for example en-US."),
            regionCode: text("Two-letter ccTLD region code."),
            units: text("METRIC or IMPERIAL."),
            optimizeWaypointOrder: { type: "boolean", description: "Reorder intermediates for the shortest route." },
            requestedReferenceRoutes: list("Reference routes to compute, for example FUEL_EFFICIENT."),
            extraComputations: list("Extra computations, for example TOLLS, FUEL_CONSUMPTION, TRAFFIC_ON_POLYLINE."),
            transitPreferences: object("TransitPreferences: allowedTravelModes, routingPreference."),
          },
          ["origin", "destination"],
        ),
        responses: { 200: json() },
        security: [key],
      },
    },
    "/distanceMatrix/v2:computeRouteMatrix": {
      post: {
        operationId: "computeRouteMatrix",
        description:
          "Returns distance and duration for every origin and destination pair (at most 625 elements). The response is an array of elements, one per pair. `X-Goog-FieldMask` is required, for example `originIndex,destinationIndex,duration,distanceMeters,status,condition`.",
        parameters: [fieldMask],
        requestBody: body(
          "ComputeRouteMatrixRequest",
          {
            origins: list("RouteMatrixOrigin items: { waypoint, routeModifiers }."),
            destinations: list("RouteMatrixDestination items: { waypoint }."),
            travelMode: text("DRIVE, BICYCLE, WALK, TWO_WHEELER or TRANSIT."),
            routingPreference: text("TRAFFIC_UNAWARE, TRAFFIC_AWARE or TRAFFIC_AWARE_OPTIMAL."),
            departureTime: text("RFC 3339 timestamp."),
            arrivalTime: text("RFC 3339 timestamp; TRANSIT only."),
            languageCode: text("BCP-47 language code."),
            regionCode: text("Two-letter ccTLD region code."),
            units: text("METRIC or IMPERIAL."),
            extraComputations: list("Extra computations, for example TOLLS."),
            trafficModel: text("BEST_GUESS, PESSIMISTIC or OPTIMISTIC."),
            transitPreferences: object("TransitPreferences: allowedTravelModes, routingPreference."),
          },
          ["origins", "destinations"],
        ),
        responses: { 200: { description: "Success", content: { "application/json": { schema: { type: "array", items: result } } } } },
        security: [key],
      },
    },
  },
  components: { securitySchemes },
};

export const geolocationDocument: JsonObject = {
  openapi: "3.0.3",
  info: {
    title: "Google Maps Geolocation API",
    version: "v1",
    description: "Locates a device from the cell towers and Wi-Fi access points it can see.",
  },
  servers: [{ url: "https://www.googleapis.com" }],
  security: [key],
  paths: {
    "/geolocation/v1/geolocate": {
      post: {
        operationId: "geolocate",
        description: "Returns an estimated location and accuracy radius from cell tower and Wi-Fi access point data. With no data it falls back to the caller's IP address when `considerIp` is true.",
        requestBody: body("GeolocationRequest", {
          homeMobileCountryCode: { type: "integer", description: "Home mobile country code of the device's carrier." },
          homeMobileNetworkCode: { type: "integer", description: "Home mobile network code of the device's carrier." },
          radioType: text("lte, gsm, cdma or wcdma."),
          carrier: text("Carrier name."),
          considerIp: { type: "boolean", description: "Fall back to IP geolocation when no tower or Wi-Fi data is given. Defaults to true." },
          cellTowers: list("Cell towers: { cellId, locationAreaCode, mobileCountryCode, mobileNetworkCode, ... }."),
          wifiAccessPoints: list("Wi-Fi access points, at least two: { macAddress, signalStrength, channel, ... }."),
        }),
        responses: { 200: json() },
        security: [key],
      },
    },
  },
  components: { securitySchemes },
};
