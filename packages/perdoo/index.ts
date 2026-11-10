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
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://eu.perdoo.com/graphql/";

const perdoo = defineProvider({
  name: "Perdoo",
  hosts: ["eu.perdoo.com"],
  auth: {
    // Perdoo offers API tokens only (Personal Settings > API Tokens); there is no OAuth.
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ me { id } }" }),
    });
    const { data } = await decodeJson(response, object({ data: object({ me: object({ id: string() }) }) }));
    return { accountInfo: { externalId: data.me.id, displayName: data.me.id } };
  },
});

export default defineApp(
  { user: { accounts: { perdoo: perdoo.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.perdoo ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({
              url,
              account,
              headers: { Authorization: `Bearer ${account.fields.token}` },
              cache,
              signal,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Perdoo",
        description: "Objectives, key results, initiatives, teams and the rest of Perdoo's GraphQL API.",
        icons,
      },
    ),
  }),
);
