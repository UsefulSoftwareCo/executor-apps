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

const rawg = defineProvider({
  name: "RAWG Video Games Database",
  hosts: ["api.rawg.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // decodeJson rejects non-2xx with a status-only error, so the key in the query string is not echoed.
    const url = new URL("https://api.rawg.io/api/genres");
    url.searchParams.set("page_size", "1");
    url.searchParams.set("key", account.fields.apiKey);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { rawg: rawg.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rawg ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "RAWG Video Games Database",
        description: "Search the RAWG video game database: games, platforms, genres, stores, developers, publishers, creators, tags, screenshots, achievements and related media.",
        icons,
      },
    ),
  }),
);
