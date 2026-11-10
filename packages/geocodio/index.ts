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

const geocodio = defineProvider({
  name: "Geocodio",
  hosts: ["api.geocod.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const url = new URL("https://api.geocod.io/v2/lists");
    url.searchParams.set("api_key", account.fields.token);
    const response = await fetch(url.toString(), { signal });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { geocodio: geocodio.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.geocodio ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Geocodio",
        description: "Geocode, reverse geocode and parse US and Canadian addresses, compute distances and manage spreadsheet lists with Geocodio.",
        icons,
      },
    ),
  }),
);
