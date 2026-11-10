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

const url = "https://api.rize.io/api/v1/graphql";

const rize = defineProvider({
  name: "Rize",
  hosts: ["api.rize.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ currentUser { email } }" }),
    });
    const { data } = await decodeJson(response, object({ data: object({ currentUser: object({ email: string() }) }) }));
    return { accountInfo: { externalId: data.currentUser.email, displayName: data.currentUser.email, email: data.currentUser.email } };
  },
});

export default defineApp(
  { user: { accounts: { rize: rize.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.rize ?? [],
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
        title: "Rize",
        description: "Time entries, projects, clients, tasks and team analytics from Rize's GraphQL API.",
        icons,
      },
    ),
  }),
);
