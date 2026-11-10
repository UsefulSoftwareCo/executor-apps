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

const url = "https://api.fireflies.ai/graphql";

const fireflies = defineProvider({
  name: "Fireflies",
  hosts: ["api.fireflies.ai"],
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
      body: JSON.stringify({ query: "{ user { user_id } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ user: object({ user_id: string() }) }) }),
    );
    return { accountInfo: { externalId: data.user.user_id } };
  },
});

export default defineApp(
  { user: { accounts: { fireflies: fireflies.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.fireflies ?? [],
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
        title: "Fireflies",
        description: "Meeting transcripts, summaries, action items, soundbites, and bot controls through Fireflies.ai's GraphQL API.",
        icons,
      },
    ),
  }),
);
