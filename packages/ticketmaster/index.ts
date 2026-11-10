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

const ticketmaster = defineProvider({
  name: "Ticketmaster",
  hosts: ["app.ticketmaster.com"],
  auth: {
    apiKey: secrets({
      label: "Consumer key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL("https://app.ticketmaster.com/discovery/v2/classifications.json");
    url.searchParams.set("apikey", account.fields.token);
    url.searchParams.set("size", "1");
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { ticketmaster: ticketmaster.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ticketmaster ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Ticketmaster",
        description: "Search Ticketmaster events, attractions, venues and classifications through the Discovery API.",
        icons,
      },
    ),
  }),
);
