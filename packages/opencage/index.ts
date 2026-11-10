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

const opencage = defineProvider({
  name: "OpenCage",
  hosts: ["api.opencagedata.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.opencagedata.com/geocode/v1/json");
    url.searchParams.set("key", account.fields.token);
    url.searchParams.set("q", "0,0");
    url.searchParams.set("limit", "1");
    url.searchParams.set("no_annotations", "1");
    url.searchParams.set("no_record", "1");
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { opencage: opencage.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.opencage ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OpenCage",
        description: "Forward and reverse geocoding with OpenCage: addresses to coordinates and coordinates to addresses, in JSON, XML or GeoJSON.",
        icons,
      },
    ),
  }),
);
