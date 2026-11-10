import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.radar.io/v1";

const radar = defineProvider({
  name: "Radar",
  hosts: ["api.radar.io"],
  auth: {
    apiKey: secrets({
      label: "API key (secret key for data management, publishable key for geocoding, search and routing)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // IP geocoding accepts both publishable and secret keys and has no side effects.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/geocode/ip`, {
      signal,
      headers: { Authorization: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ meta: object({ code: number() }) }));
  },
});

type Account = { fields: { token: string } };
type Params = Record<string, string | number | boolean | undefined>;

const headers = (account: Account) => ({ Authorization: account.fields.token, Accept: "application/json" });

const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const seg = encodeURIComponent;

/** Radar addresses geofences, trips and beacons either by `id` or by `tag` + `externalId`. */
const target = (input: { id?: string; tag?: string; externalId?: string }) => {
  if (input.id !== undefined) return seg(input.id);
  if (input.tag !== undefined && input.externalId !== undefined) return `${seg(input.tag)}/${seg(input.externalId)}`;
  throw new Error("Provide either id, or both tag and externalId.");
};

const radarTools = (account: Account, signal: AbortSignal) => {
  const h = headers(account);
  const jsonHeaders = { ...h, "content-type": "application/json" };
  const get = (fetch: typeof globalThis.fetch, path: string, params: Params = {}) =>
    fetch(`${base}${path}${search(params)}`, { signal, headers: h });
  const send = (fetch: typeof globalThis.fetch, method: string, path: string, body?: unknown) =>
    fetch(`${base}${path}`, {
      method,
      signal,
      headers: jsonHeaders,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  return router({
    geocoding: router({
      forward: query(
        {
          description:
            "Geocode a complete address to coordinates. Returns addresses with latitude, longitude, confidence (exact, interpolated, fallback) and parsed components. For partial addresses use autocomplete. layers is a comma-separated list of place, address, postalCode, locality, county, state, country, coarse, fine; country is comma-separated 2-letter codes; lang is one of ar, de, en, es, fr, ja, ko, pt, ru, zh.",
          input: object({
            query: string(),
            layers: string().optional(),
            country: string().optional(),
            lang: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/geocode/forward", input), json()),
      ),
      reverse: query(
        {
          description:
            "Reverse geocode coordinates to addresses. coordinates is the string \"latitude,longitude\". layers is a comma-separated list of place, address, postalCode, locality, county, state, country, coarse, fine.",
          input: object({ coordinates: string(), layers: string().optional(), lang: string().optional() }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/geocode/reverse", input), json()),
      ),
      ip: query(
        {
          description:
            "Geocode the IP address of the request to a country, state, city and coordinates, and report whether the IP is a proxy. Note the request comes from Executor's servers, so the result describes that origin.",
          input: object({}),
        },
        async ({ fetch }) => decodeJson(await get(fetch, "/geocode/ip"), json()),
      ),
    }),
    search: router({
      autocomplete: query(
        {
          description:
            "Autocomplete partial addresses and place names. near is \"latitude,longitude\" to bias results; limit is 1-100 (default 10); countryCode is comma-separated 2-letter codes; layers as in forward geocoding.",
          input: object({
            query: string(),
            near: string().optional(),
            layers: string().optional(),
            limit: number().optional(),
            countryCode: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/search/autocomplete", input), json()),
      ),
      geofences: query(
        {
          description:
            "Find geofences near a location, nearest first. near is \"latitude,longitude\"; limit 1-1000 (default 100); radius in meters; tags is comma-separated; set includeGeometry false to omit geometries.",
          input: object({
            near: string(),
            limit: number().optional(),
            radius: number().optional(),
            tags: string().optional(),
            includeGeometry: boolean().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/search/geofences", input), json()),
      ),
      places: query(
        {
          description:
            "Search places (businesses, chains, airports) near a location. near is \"latitude,longitude\". Provide chains (comma-separated chain slugs) or categories (comma-separated), or iataCode alone for an airport. radius 1-10000 meters (default 1000); limit 1-100 (default 10).",
          input: object({
            near: string().optional(),
            chains: string().optional(),
            categories: string().optional(),
            iataCode: string().optional(),
            radius: number().optional(),
            limit: number().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/search/places", input), json()),
      ),
      users: query(
        {
          description:
            "Find tracked users near a location. near is \"latitude,longitude\"; radius in meters 100-10000 (default 1000), or travel minutes when mode is set (car, truck, foot, bike); limit 1-100. Needs a secret key.",
          input: object({
            near: string(),
            radius: number().optional(),
            mode: string().optional(),
            limit: number().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/search/users", input), json()),
      ),
      validateAddress: query(
        {
          description:
            "Validate a structured US or Canada address (enterprise plans only). Requires city, stateCode, postalCode and countryCode, plus either addressLabel (first line) or number and street. Returns a verificationStatus and the normalized address.",
          input: object({
            city: string(),
            stateCode: string(),
            postalCode: string(),
            countryCode: string(),
            number: string().optional(),
            street: string().optional(),
            unit: string().optional(),
            addressLabel: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/addresses/validate", input), json()),
      ),
    }),
    routing: router({
      distance: query(
        {
          description:
            "Distance and travel duration between two points. origin and destination are \"latitude,longitude\"; modes is comma-separated from car, truck, foot, bike; units is metric or imperial (default imperial); avoid is comma-separated from tolls, highways, ferries, borderCrossings; geometry is linestring, polyline5 or polyline6; departureTime is an ISO 8601 date for historical traffic.",
          input: object({
            origin: string(),
            destination: string(),
            modes: string(),
            units: string().optional(),
            avoid: string().optional(),
            geometry: string().optional(),
            departureTime: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/route/distance", input), json()),
      ),
      matrix: query(
        {
          description:
            "Distance and duration matrix. origins and destinations are pipe-delimited \"lat,lng|lat,lng\" lists; mode is one of car, truck, foot, bike; units is metric or imperial; avoid is comma-separated from tolls, highways, ferries.",
          input: object({
            origins: string(),
            destinations: string(),
            mode: string(),
            units: string().optional(),
            avoid: string().optional(),
            departureTime: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/route/matrix", input), json()),
      ),
      directions: query(
        {
          description:
            "Turn-by-turn directions through up to 25 locations in order. locations is a pipe-delimited \"lat,lng|lat,lng\" list. mode defaults to car; units is metric or imperial; avoid as in distance; geometry is linestring, polyline5 or polyline6; heading is 0-359 degrees; alternatives (two locations only) requests alternate routes; lang is one of de, en, es, fr, ja, ko, pt, ru.",
          input: object({
            locations: string(),
            mode: string().optional(),
            units: string().optional(),
            avoid: string().optional(),
            geometry: string().optional(),
            departureTime: string().optional(),
            heading: number().optional(),
            alternatives: boolean().optional(),
            lang: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/route/directions", input), json()),
      ),
      optimize: query(
        {
          description:
            "Reorder up to 10 locations into the fastest route (traveling salesman). locations is a pipe-delimited \"lat,lng|lat,lng\" list whose first entry is the origin. mode defaults to car.",
          input: object({
            locations: string(),
            mode: string().optional(),
            units: string().optional(),
            geometry: string().optional(),
            departureTime: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/route/optimize", input), json()),
      ),
      match: query(
        {
          description:
            "Snap a GPS trace to roads (map matching). path is a list of {\"coordinates\": \"lat,lng\", \"createdAt\"?: ISO date, \"accuracy\"?: meters}; sample under 10 seconds apart for best results. mode defaults to car; roadAttributes is comma-separated from speedLimit, names, roadClass. Read-only.",
          input: object({
            path: array(json()),
            mode: string().optional(),
            roadAttributes: string().optional(),
            units: string().optional(),
            geometry: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await send(fetch, "POST", "/route/match", input), json()),
      ),
    }),
    users: router({
      list: query(
        {
          description:
            "List tracked users, most recently updated first. limit 1-1000 (default 100); paginate with updatedBefore or updatedAfter ISO dates. Needs a secret key.",
          input: object({
            limit: number().optional(),
            updatedBefore: string().optional(),
            updatedAfter: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/users", input), json()),
      ),
      get: query(
        {
          description: "Get one tracked user by Radar _id, userId or deviceId, with current geofences, place and regions.",
          input: object({ id: string() }),
        },
        async ({ fetch }, { id }) => decodeJson(await get(fetch, `/users/${seg(id)}`), json()),
      ),
      track: mutation(
        {
          description:
            "Record a location update for a user, which may create or update the user and generate geofence, place and trip events. deviceId, latitude, longitude and accuracy (meters) are required; userId, metadata (up to 32 string, number or boolean values), description, stopped, foreground and updatedAt are optional. Do not send PII in userId.",
          input: object({
            deviceId: string(),
            latitude: number(),
            longitude: number(),
            accuracy: number(),
            userId: string().optional(),
            description: string().optional(),
            metadata: json().optional(),
            stopped: boolean().optional(),
            foreground: boolean().optional(),
            deviceType: string().optional(),
            updatedAt: string().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) => decodeJson(await send(fetch, "POST", "/track", input), json()),
      ),
      delete: mutation(
        {
          description: "Delete a tracked user by Radar _id, userId or deviceId.",
          input: object({ id: string() }),
          approval: always(),
        },
        async ({ fetch }, { id }) => decodeJson(await send(fetch, "DELETE", `/users/${seg(id)}`), json()),
      ),
      refresh: mutation(
        {
          description:
            "Send a remote track request (silent push or push extension) asking up to 10 users' devices to report their location. type is silentPush or pushExtension.",
          input: object({ userIds: array(string()), type: string().optional() }),
          approval: always(),
        },
        async ({ fetch }, input) => decodeJson(await send(fetch, "POST", "/users/refresh", input), json()),
      ),
    }),
    trips: router({
      list: query(
        {
          description:
            "List trips. status is comma-separated from pending, started, approaching, arrived, completed, canceled, expired; externalId is comma-separated; sortBy is createdAt or updatedAt; limit 1-1000 (default 500). Needs a secret key.",
          input: object({
            status: string().optional(),
            destinationGeofenceTag: string().optional(),
            destinationGeofenceExternalId: string().optional(),
            externalId: string().optional(),
            userId: string().optional(),
            includeLocations: boolean().optional(),
            createdAfter: string().optional(),
            createdBefore: string().optional(),
            sortBy: string().optional(),
            delayed: boolean().optional(),
            limit: number().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/trips", input), json()),
      ),
      get: query(
        {
          description: "Get a trip by Radar _id or by its externalId.",
          input: object({ id: string() }),
        },
        async ({ fetch }, { id }) => decodeJson(await get(fetch, `/trips/${seg(id)}`), json()),
      ),
      create: mutation(
        {
          description:
            "Create a trip with a stable externalId. Optionally set userId, mode (foot, bike, car), a destination by destinationGeofenceTag and destinationGeofenceExternalId, approachingThreshold (minutes), scheduledArrivalAt and metadata.",
          input: object({
            externalId: string(),
            userId: string().optional(),
            mode: string().optional(),
            destinationGeofenceTag: string().optional(),
            destinationGeofenceExternalId: string().optional(),
            approachingThreshold: number().optional(),
            scheduledArrivalAt: string().optional(),
            metadata: json().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) => decodeJson(await send(fetch, "POST", "/trips", input), json()),
      ),
      update: mutation(
        {
          description:
            "Update a trip by Radar _id or externalId. status is required: pending, started, approaching, arrived, completed or canceled. Other fields match create.",
          input: object({
            id: string(),
            status: string(),
            mode: string().optional(),
            destinationGeofenceTag: string().optional(),
            destinationGeofenceExternalId: string().optional(),
            approachingThreshold: number().optional(),
            scheduledArrivalAt: string().optional(),
            metadata: json().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, { id, ...body }) =>
          decodeJson(await send(fetch, "PATCH", `/trips/${seg(id)}/update`, body), json()),
      ),
      delete: mutation(
        {
          description: "Delete a trip by Radar _id.",
          input: object({ id: string() }),
          approval: always(),
        },
        async ({ fetch }, { id }) => decodeJson(await send(fetch, "DELETE", `/trips/${seg(id)}`), json()),
      ),
    }),
    geofences: router({
      list: query(
        {
          description:
            "List geofences. Filter by tag or externalId; limit 1-1000 (default 100); paginate with createdBefore, createdAfter, updatedBefore or updatedAfter ISO dates. Needs a secret key.",
          input: object({
            limit: number().optional(),
            tag: string().optional(),
            externalId: string().optional(),
            createdBefore: string().optional(),
            createdAfter: string().optional(),
            updatedBefore: string().optional(),
            updatedAfter: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/geofences", input), json()),
      ),
      get: query(
        {
          description: "Get a geofence by Radar id, or by tag and externalId together.",
          input: object({ id: string().optional(), tag: string().optional(), externalId: string().optional() }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, `/geofences/${target(input)}`), json()),
      ),
      users: query(
        {
          description: "List the users currently inside a geofence identified by tag and externalId.",
          input: object({ tag: string(), externalId: string() }),
        },
        async ({ fetch }, { tag, externalId }) =>
          decodeJson(await get(fetch, `/geofences/${seg(tag)}/${seg(externalId)}/users`), json()),
      ),
      upsert: mutation(
        {
          description:
            "Create or update a geofence, addressed by Radar id or by tag and externalId. description and type (circle, polygon, isochrone) are required. Provide the center as coordinates ([longitude, latitude] array for circle and isochrone, or the polygon ring for polygon), address, or placeId. radius is meters (10-10000) for circle and minutes for isochrone; mode is required for isochrone. Optional: metadata, userId, userIds, ip, enabled, disableAfter, deleteAfter, stopDetection, tripApproachingThreshold, dwellThreshold, operatingHours.",
          input: object({
            id: string().optional(),
            tag: string().optional(),
            externalId: string().optional(),
            description: string(),
            type: string(),
            coordinates: json().optional(),
            address: string().optional(),
            placeId: string().optional(),
            radius: number().optional(),
            mode: string().optional(),
            metadata: json().optional(),
            userId: string().optional(),
            userIds: string().optional(),
            ip: string().optional(),
            enabled: boolean().optional(),
            disableAfter: string().optional(),
            deleteAfter: string().optional(),
            stopDetection: boolean().optional(),
            tripApproachingThreshold: number().optional(),
            dwellThreshold: number().optional(),
            operatingHours: json().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, { id, tag, externalId, ...body }) =>
          decodeJson(await send(fetch, "PUT", `/geofences/${target({ id, tag, externalId })}`, body), json()),
      ),
      delete: mutation(
        {
          description: "Delete a geofence by Radar id, or by tag and externalId together.",
          input: object({ id: string().optional(), tag: string().optional(), externalId: string().optional() }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          decodeJson(await send(fetch, "DELETE", `/geofences/${target(input)}`), json()),
      ),
    }),
    beacons: router({
      list: query(
        {
          description:
            "List beacons. Filter by tag or externalId; limit 1-1000 (default 100); paginate with createdBefore or createdAfter ISO dates. Needs a secret key.",
          input: object({
            limit: number().optional(),
            tag: string().optional(),
            externalId: string().optional(),
            createdBefore: string().optional(),
            createdAfter: string().optional(),
          }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, "/beacons", input), json()),
      ),
      get: query(
        {
          description: "Get a beacon by Radar id, or by tag and externalId together.",
          input: object({ id: string().optional(), tag: string().optional(), externalId: string().optional() }),
        },
        async ({ fetch }, input) => decodeJson(await get(fetch, `/beacons/${target(input)}`), json()),
      ),
      create: mutation(
        {
          description:
            "Create a beacon. description, tag, externalId, type (ibeacon or eddystone) and coordinates ([longitude, latitude]) are required. iBeacons need uuid, major and minor; Eddystone beacons need uid and instance. Optional: enabled, metadata.",
          input: object({
            description: string(),
            tag: string(),
            externalId: string(),
            type: string(),
            coordinates: json(),
            uuid: string().optional(),
            major: string().optional(),
            minor: string().optional(),
            uid: string().optional(),
            instance: string().optional(),
            enabled: boolean().optional(),
            metadata: json().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) => decodeJson(await send(fetch, "POST", "/beacons", input), json()),
      ),
      upsert: mutation(
        {
          description:
            "Create or update a beacon, addressed by Radar id or by tag and externalId. Fields match create.",
          input: object({
            id: string().optional(),
            tag: string().optional(),
            externalId: string().optional(),
            description: string(),
            type: string(),
            coordinates: json(),
            uuid: string().optional(),
            major: string().optional(),
            minor: string().optional(),
            uid: string().optional(),
            instance: string().optional(),
            enabled: boolean().optional(),
            metadata: json().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, { id, tag, externalId, ...body }) =>
          decodeJson(
            await send(fetch, "PUT", `/beacons/${target({ id, tag, externalId })}`, {
              ...body,
              ...(tag === undefined ? {} : { tag }),
              ...(externalId === undefined ? {} : { externalId }),
            }),
            json(),
          ),
      ),
      delete: mutation(
        {
          description: "Delete a beacon by Radar id, or by tag and externalId together.",
          input: object({ id: string().optional(), tag: string().optional(), externalId: string().optional() }),
          approval: always(),
        },
        async ({ fetch }, input) => decodeJson(await send(fetch, "DELETE", `/beacons/${target(input)}`), json()),
      ),
    }),
    events: router({
      logConversion: mutation(
        {
          description:
            "Log a conversion event. Conversions are available only on Radar's Enterprise plan. name is required (alphanumeric and underscores, for example in_app_purchase). Identify the user with userId, deviceId or installId. Optional: revenue, duration (minutes), createdAt, metadata (no PII).",
          input: object({
            name: string(),
            userId: string().optional(),
            deviceId: string().optional(),
            installId: string().optional(),
            revenue: number().optional(),
            duration: number().optional(),
            createdAt: string().optional(),
            metadata: json().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) => decodeJson(await send(fetch, "POST", "/events", input), json()),
      ),
    }),
    settings: router({
      get: query(
        {
          description: "Get the project's Places settings: chainMetadata, chainMappings and placeFilters. Needs a secret key.",
          input: object({}),
        },
        async ({ fetch }) => decodeJson(await get(fetch, "/settings"), json()),
      ),
      update: mutation(
        {
          description:
            "Update the project's Places settings. Any of chainMetadata, chainMappings and placeFilters, as objects, for example {\"chainMappings\": {\"mcdonalds\": \"retailer1\"}, \"placeFilters\": {\"chain\": [\"mcdonalds\"]}}.",
          input: object({
            chainMetadata: json().optional(),
            chainMappings: json().optional(),
            placeFilters: json().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) => decodeJson(await send(fetch, "PATCH", "/settings", input), json()),
      ),
    }),
  });
};

export default defineApp({ user: { accounts: { radar: radar.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.radar ?? [], (account) => radarTools(account, signal), { signal }), {
    title: "Radar",
    description:
      "Radar location infrastructure: geocoding, address autocomplete, place and geofence search, routing, and managing geofences, trips, users, beacons and events.",
    icons,
  }),
}));
