import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const giphy = defineProvider({
  name: "Giphy",
  hosts: ["api.giphy.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    // /v1/randomid answers 200 for any key, so probe a keyed read-only endpoint. GIPHY returns a real HTTP 401
    // for a bad key; decodeJson rejects non-2xx with a status-only error (no URL or body), so the key in the
    // query string is not echoed into error messages. The meta.status check is belt and braces.
    const url = new URL("https://api.giphy.com/v1/gifs/trending");
    url.searchParams.set("limit", "1");
    url.searchParams.set("api_key", account.fields.apiKey);
    const response = await fetch(url.toString(), { signal });
    const body = await decodeJson(response, object({ meta: object({ status: number() }) }));
    if (body.meta.status !== 200) throw new Error(`GIPHY health check failed: meta.status ${body.meta.status}`);
  },
});

export default defineApp(
  { user: { accounts: { giphy: giphy.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.giphy ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Giphy",
        description: "Search and fetch GIFs and stickers from GIPHY: search, trending, translate, random, lookups by id, categories, tag suggestions, channels and emoji.",
        icons,
      },
    ),
  }),
);
