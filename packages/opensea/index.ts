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

const opensea = defineProvider({
  name: "OpenSea",
  hosts: ["api.opensea.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch("https://api.opensea.io/api/v2/collections/boredapeyachtclub", {
      signal,
      headers: { "x-api-key": account.fields.token },
    });
    await decodeJson(response, object({ collection: string() }));
  },
});

export default defineApp(
  { user: { accounts: { opensea: opensea.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.opensea ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "OpenSea",
        description: "Browse and trade NFTs on OpenSea: collections, NFTs, listings, offers, events, accounts, tokens and drops.",
        icons,
      },
    ),
  }),
);
