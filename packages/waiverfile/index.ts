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

// The Swagger declares these state-changing operations as HTTP GET, so they compile as queries.
const GET_MUTATIONS = new Set(["waiverEvent.createEvent", "waiverEvent.deleteEvent"]);

const waiverfile = defineProvider({
  name: "WaiverFile",
  hosts: ["api.waiverfile.com"],
  auth: {
    apiKey: secrets({
      label: "API key and Site ID",
      fields: object({ apiKey: string({ minLength: 1 }), siteID: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const query = new URLSearchParams({ apiKey: account.fields.apiKey, siteID: account.fields.siteID });
    const response = await fetch(`https://api.waiverfile.com/api/v1/GetSiteDetails?${query}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { waiverfile: waiverfile.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.waiverfile ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool, name) =>
            tool.kind === "mutation" || GET_MUTATIONS.has(name) ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "WaiverFile",
        description: "WaiverFile digital waivers: signed waivers, waiver forms, events, SMS subscribers and webhook subscriptions.",
        icons,
      },
    ),
  }),
);
