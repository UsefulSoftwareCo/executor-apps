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
import { options } from "./openapi.js";

const solcast = defineProvider({
  name: "Solcast",
  hosts: ["api.solcast.com.au"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Cheapest authenticated read: one hour of live irradiance (counts as one API request).
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.solcast.com.au/data/live/radiation_and_weather?latitude=0&longitude=0&hours=1&format=json", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { solcast: solcast.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.solcast ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Solcast",
        description: "Solar irradiance, weather, PV and wind power forecasts, live, historic and TMY data, soiling, and site resources from Solcast.",
        icons,
      },
    ),
  }),
);
