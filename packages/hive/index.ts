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

const url = "https://prod-gql.hive.com/graphql";

const hive = defineProvider({
  name: "Hive",
  hosts: ["prod-gql.hive.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // An unauthenticated request gets `user: null`, which fails the object decode.
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { api_key: account.fields.token, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ user { _id email } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ user: object({ _id: string(), email: string() }) }) }),
    );
    return { accountInfo: { externalId: data.user._id, displayName: data.user.email, email: data.user.email } };
  },
});

export default defineApp(
  { user: { accounts: { hive: hive.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.hive ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: { api_key: account.fields.token }, cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Hive",
        description: "Projects, actions, comments, timesheets and the rest of Hive's GraphQL API.",
        icons,
      },
    ),
  }),
);
