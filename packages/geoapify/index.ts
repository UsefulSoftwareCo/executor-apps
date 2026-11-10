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
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { apis } from "./openapi.js";

const geoapify = defineProvider({
  name: "Geoapify",
  hosts: ["api.geoapify.com", "maps.geoapify.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // An invalid key gets 401; a valid one returns a GeoJSON collection (a real query, billed as one request).
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.geoapify.com/v1/geocode/search?text=Berlin&limit=1&format=geojson", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ type: string() }));
  },
});

export default defineApp(
  { user: { accounts: { geoapify: geoapify.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.geoapify ?? [],
        (account) => {
          const mount = (options: (typeof apis)[keyof typeof apis]) =>
            withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
              tool.kind === "mutation" ? always() : undefined,
            );
          return router(
            Object.fromEntries(Object.entries(apis).map(([key, options]) => [key, mount(options)])) as Record<
              keyof typeof apis,
              ReturnType<typeof mount>
            >,
            { title: "Geoapify", description: "Geoapify location APIs." },
          );
        },
        { signal },
      ),
      {
        title: "Geoapify",
        description:
          "Geoapify location platform: geocoding, reverse geocoding, address autocomplete, batch jobs, places and place details, routing, route matrix and planner, isolines, map matching, boundaries, postcodes, elevation, IP geolocation, geometry, map tiles and static maps.",
        icons,
      },
    ),
  }),
);
