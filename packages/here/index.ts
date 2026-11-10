import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  secrets,
  string,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter, type OpenapiToolNamesOptions } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const here = defineProvider({
  name: "HERE",
  hosts: [
    "*.search.hereapi.com",
    "router.hereapi.com",
    "*.router.hereapi.com",
    "wps.hereapi.com",
    "routematching.hereapi.com",
    "geofencing.hereapi.com",
    "data.traffic.hereapi.com",
    "weather.hereapi.com",
    "transit.hereapi.com",
    "fuel.hereapi.com",
    "evcp.hereapi.com",
    "positioning.hereapi.com",
    "tourplanning.hereapi.com",
  ],
  auth: {
    apiKey: secrets({
      label: "HERE API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  // Geocoding is available to every project, and HERE answers a bad key with 401.
  async health({ account, fetch, signal }) {
    const url = new URL("https://geocode.search.hereapi.com/v1/geocode");
    url.searchParams.set("q", "Berlin");
    url.searchParams.set("limit", "1");
    url.searchParams.set("apiKey", account.fields.apiKey);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({ items: array(object({ title: string() })) }));
  },
});

export default defineApp(
  { user: { accounts: { here: here.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.here ?? [],
        (account) => {
          const mount = (options: OpenapiToolNamesOptions) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            {
              geocode: mount(apis.geocode),
              reverseGeocode: mount(apis.reverseGeocode),
              multiReverseGeocode: mount(apis.multiReverseGeocode),
              autosuggest: mount(apis.autosuggest),
              autocomplete: mount(apis.autocomplete),
              browse: mount(apis.browse),
              discover: mount(apis.discover),
              lookup: mount(apis.lookup),
              batchGeocoding: mount(apis.batch),
              routing: mount(apis.routing),
              isoline: mount(apis.isoline),
              matrix: mount(apis.matrix),
              waypoints: mount(apis.waypoints),
              routeMatching: mount(apis.routeMatching),
              geofencing: mount(apis.geofencing),
              traffic: mount(apis.traffic),
              weather: mount(apis.weather),
              transit: mount(apis.transit),
              intermodal: mount(apis.intermodal),
              fuel: mount(apis.fuel),
              evChargePoints: mount(apis.evChargePoints),
              positioning: mount(apis.positioning),
              tourPlanning: mount(apis.tourPlanning),
            },
            { title: "HERE", description: "HERE account." },
          );
        },
        { signal },
      ),
      {
        title: "HERE",
        description:
          "HERE location services. geocode, reverseGeocode, multiReverseGeocode, autosuggest, autocomplete, browse, discover, lookup: Geocoding and Search v7. batchGeocoding: Batch API jobs. routing, isoline, matrix, intermodal, transit: routes, reachable areas, matrices, public transit. waypoints: optimise stop order. routeMatching: snap a GPS trace to roads. geofencing: test points against geofence layers. traffic: flow and incidents. weather: reports, radar tiles and alerts. fuel, evChargePoints: stations and prices. positioning: locate a device from radio measurements. tourPlanning: vehicle routing problems.",
        icons,
      },
    ),
  }),
);
