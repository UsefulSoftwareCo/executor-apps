import {
  accountRouter,
  array,
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
import { options } from "./openapi.js";

const graphhopper = defineProvider({
  name: "GraphHopper",
  hosts: ["graphhopper.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /profiles lists custom profiles and returns a JSON array.
  async health({ account, fetch, signal }) {
    const url = new URL("https://graphhopper.com/api/1/profiles");
    url.searchParams.set("key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, array(object({})));
  },
});

export default defineApp(
  { user: { accounts: { graphhopper: graphhopper.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.graphhopper ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "GraphHopper",
        description:
          "GraphHopper Directions API: routing, route optimization, distance matrices, isochrones, geocoding, map matching, clustering and custom profiles.",
        icons,
      },
    ),
  }),
);
