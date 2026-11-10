import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter, type OpenapiToolNamesOptions } from "apps/openapi";
import { icons } from "./icon.js";
import {
  addressValidationOptions,
  airQualityOptions,
  geocodingOptions,
  geolocationOptions,
  placesOptions,
  pollenOptions,
  roadsOptions,
  routesOptions,
  solarOptions,
  weatherOptions,
} from "./openapi.js";

const googleMaps = defineProvider({
  name: "Google Maps",
  hosts: [
    "maps.googleapis.com",
    "places.googleapis.com",
    "routes.googleapis.com",
    "addressvalidation.googleapis.com",
    "solar.googleapis.com",
    "airquality.googleapis.com",
    "pollen.googleapis.com",
    "weather.googleapis.com",
    "roads.googleapis.com",
    "www.googleapis.com",
  ],
  auth: {
    apiKey: secrets({
      label: "Maps Platform API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  // Maps web services answer HTTP 200 with a status field, so a bad key must be read from the body. The check uses
  // the Geocoding API, which therefore has to be enabled for the key.
  async health({ account, fetch, signal }) {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", "Mountain View");
    url.searchParams.set("key", account.fields.apiKey);
    const response = await fetch(url.toString(), { signal });
    const body = await decodeJson(response, object({ status: string() }));
    if (body.status !== "OK" && body.status !== "ZERO_RESULTS") {
      throw new Error(`Google Maps rejected the API key (${body.status}). Enable the Geocoding API for it.`);
    }
  },
});

export default defineApp(
  { user: { accounts: { googleMaps: googleMaps.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.googleMaps ?? [],
        (account) => {
          const mount = (options: OpenapiToolNamesOptions) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              places: mount(placesOptions),
              geocoding: mount(geocodingOptions),
              routes: mount(routesOptions),
              addressValidation: mount(addressValidationOptions),
              weather: mount(weatherOptions),
              airQuality: mount(airQualityOptions),
              pollen: mount(pollenOptions),
              solar: mount(solarOptions),
              roads: mount(roadsOptions),
              geolocation: mount(geolocationOptions),
            },
            { title: "Google Maps", description: "Google Maps Platform account." },
          );
        },
        { signal },
      ),
      {
        title: "Google Maps",
        description:
          "Google Maps Platform. places: text, nearby and autocomplete search, place details and photos. geocoding: geocode, reverse geocode, elevation, time zone. routes: routes and route matrices. addressValidation: validate postal addresses. weather, airQuality, pollen: conditions and forecasts. solar: rooftop solar potential. roads: snap to roads, nearest roads, speed limits. geolocation: locate a device.",
        icons,
      },
    ),
  }),
);
