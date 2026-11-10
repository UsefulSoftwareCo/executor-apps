// Google Maps Platform is one product served from several hosts, so each API is its own document mounted under its
// own key in index.ts. places, addressvalidation, solar, airquality, pollen, weather and roads are generated from
// Google's official Discovery documents by discovery-to-openapi.mjs (revision 20261006 to 20261007); geocoding,
// routes and geolocation are hand-written in legacy.ts because Google publishes no machine-readable description.
// Credentials are the Maps Platform API key, sent as the `key` query parameter.
import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import addressvalidation from "./addressvalidation-openapi.json" with { type: "json" };
import airquality from "./airquality-openapi.json" with { type: "json" };
import places from "./places-openapi.json" with { type: "json" };
import pollen from "./pollen-openapi.json" with { type: "json" };
import roads from "./roads-openapi.json" with { type: "json" };
import solar from "./solar-openapi.json" with { type: "json" };
import weather from "./weather-openapi.json" with { type: "json" };
import { geocodingDocument, geolocationDocument, routesDocument } from "./legacy.ts";

// The inferred JSON type has no index signature, so widen it once here.
const widen = (value: unknown): JsonObject => JSON.parse(JSON.stringify(value));

const shared = {
  securitySchemes: { apiKey: { type: "apiKey", in: "query", name: "key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} as const;

const api = <const K extends Record<string, "query">>(
  document: unknown,
  origin: string,
  kinds: K,
  patches?: NonNullable<OpenapiToolNamesOptions["patches"]>,
) =>
  ({ ...shared, source: { document: widen(document) }, allowedOrigin: origin, kinds, ...(patches ? { patches } : {}) }) satisfies OpenapiToolNamesOptions;

// Places (New) rejects searchText, searchNearby and places.get without a field mask (X-Goog-FieldMask header), and the
// Discovery document drops the global `fields` parameter, so add the header as a required parameter. Autocomplete does
// not need it. Arrays are valid patch values at runtime; the declared type only admits objects.
const placesPatches = [
  { op: "replace", path: "/paths/~1v1~1places:searchText/post/parameters", value: [{"name": "X-Goog-FieldMask", "in": "header", "required": true, "description": "Required. Comma-separated response fields to return, for example `places.displayName,places.formattedAddress,places.id` (use `*` to return everything, which is billed at the highest tier). The request fails without it.", "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1v1~1places:searchNearby/post/parameters", value: [{"name": "X-Goog-FieldMask", "in": "header", "required": true, "description": "Required. Comma-separated response fields to return, for example `places.displayName,places.formattedAddress,places.id` (use `*` to return everything, which is billed at the highest tier). The request fails without it.", "schema": {"type": "string"}}] },
  { op: "replace", path: "/paths/~1v1~1places~1{placesId}/get/parameters", value: [{"name": "placesId", "in": "path", "required": true, "description": "Segment placesId of the resource name (Required. The resource name of a place, in the `places/{place_id}` format.).", "schema": {"type": "string"}}, {"name": "languageCode", "in": "query", "required": false, "description": "Optional. Place details will be displayed with the preferred language if available. Current list of supported languages: https://developers.google.com/maps/faq#languagesupport.", "schema": {"type": "string"}}, {"name": "regionCode", "in": "query", "required": false, "description": "Optional. The Unicode country/region code (CLDR) of the location where the request is coming from. This parameter is used to display the place details, like region-specific place name, if available. The parameter can affect results based on applicable law. For more information, see https://www.unicode.org/cldr/charts/latest/supplemental/territory_language_information.html. Note that 3-digit region codes are not currently supported.", "schema": {"type": "string"}}, {"name": "sessionToken", "in": "query", "required": false, "description": "Optional. A string which identifies an Autocomplete session for billing purposes. Must be a URL and filename safe base64 string with at most 36 ASCII characters in length. Otherwise an INVALID_ARGUMENT error is returned. The session begins when the user starts typing a query, and concludes when they select a place and a call to Place Details or Address Validation is made. Each session can have multiple queries, followed by one Place Details or Address Validation request. The credentials used for each request within a session must belong to the same Google Cloud Console project. Once a session has concluded, the token is no longer valid; your app must generate a fresh token for each session. If the `session_token` parameter is omitted, or if you reuse a session token, the session is charged as if no session token was provided (each request is billed separately). We recommend the following guidelines: * Use session tokens for all Place Autocomplete calls. * Generate a fresh token for each session. Using a version 4 UUID is recommended. * Ensure that the credentials used for all Place Autocomplete, Place Details, and Address Validation requests within a session belong to the same Cloud Console project. * Be sure to pass a unique session token for each new session. Using the same token for more than one session will result in each request being billed individually.", "schema": {"type": "string"}}, {"name": "X-Goog-FieldMask", "in": "header", "required": true, "description": "Required. Comma-separated response fields to return, for example `places.displayName,places.formattedAddress,places.id` (use `*` to return everything, which is billed at the highest tier). The request fails without it.", "schema": {"type": "string"}}] },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

// POST operations that only read are queries, so they run without an approval prompt.
export const placesOptions = api(places, "https://places.googleapis.com", {
  "places.places.searchText": "query",
  "places.places.searchNearby": "query",
  "places.places.autocomplete": "query",
}, placesPatches);
export const addressValidationOptions = api(addressvalidation, "https://addressvalidation.googleapis.com", {
  "addressvalidation.validateAddress": "query",
});
export const solarOptions = api(solar, "https://solar.googleapis.com", {});
export const airQualityOptions = api(airquality, "https://airquality.googleapis.com", {
  "airquality.currentConditions.lookup": "query",
  "airquality.forecast.lookup": "query",
  "airquality.history.lookup": "query",
});
export const pollenOptions = api(pollen, "https://pollen.googleapis.com", {});
export const weatherOptions = api(weather, "https://weather.googleapis.com", {});
export const roadsOptions = api(roads, "https://roads.googleapis.com", {});
export const geocodingOptions = api(geocodingDocument, "https://maps.googleapis.com", {});
export const routesOptions = api(routesDocument, "https://routes.googleapis.com", {
  computeRoutes: "query",
  computeRouteMatrix: "query",
});
export const geolocationOptions = api(geolocationDocument, "https://www.googleapis.com", { geolocate: "query" });

// scripts/tools.ts counts this one; the others are counted by the README check.
export const options = placesOptions;
