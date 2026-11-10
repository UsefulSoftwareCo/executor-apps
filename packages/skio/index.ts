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

const url = "https://graphql.skio.com/v1/graphql";

const skio = defineProvider({
  name: "Skio",
  hosts: ["graphql.skio.com"],
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
      headers: authorization(account),
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    const { data } = await decodeJson(response, object({ data: object({ __typename: string() }) }));
    return { accountInfo: { externalId: "skio", displayName: `Skio (${data.__typename})` } };
  },
});

// Skio expects `authorization: API <token>` (header name is case sensitive).
function authorization(account: { fields: { token: string } }) {
  return { authorization: `API ${account.fields.token}`, "content-type": "application/json" };
}

export default defineApp(
  { user: { accounts: { skio: skio.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.skio ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: authorization(account), cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Skio",
        description: "Subscriptions, subscribers, products, orders and the rest of Skio's GraphQL API.",
        icons,
      },
    ),
  }),
);
