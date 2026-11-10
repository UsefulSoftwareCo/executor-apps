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

const url = "https://api.slab.com/v1/graphql";

const slab = defineProvider({
  name: "Slab",
  hosts: ["api.slab.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { Authorization: account.fields.token, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    // Schema fields could not be confirmed without a token, so only __typename is queried.
    await decodeJson(response, object({ data: object({ __typename: string() }) }));
  },
});

export default defineApp(
  { user: { accounts: { slab: slab.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.slab ?? [],
        async (account) =>
          withApprovals(
            // Slab expects the bare API token in the Authorization header.
            await graphqlRouter({ url, account, headers: { Authorization: account.fields.token }, cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Slab",
        description: "Posts, topics, comments and search in Slab's GraphQL API.",
        icons,
      },
    ),
  }),
);
