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

const url = "https://cults3d.com/graphql";

const cults = defineProvider({
  name: "Cults",
  hosts: ["cults3d.com"],
  auth: {
    // Cults uses HTTP Basic auth: the account nickname plus an API key as the password.
    apiKey: secrets({
      label: "Username and API key",
      fields: object({ username: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { ...authorization(account), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ myself { __typename } }" }),
    });
    await decodeJson(response, object({ data: object({ myself: object({ __typename: string() }) }) }));
    return { accountInfo: { externalId: account.fields.username, displayName: account.fields.username } };
  },
});

function authorization(account: { fields: { username: string; token: string } }) {
  return { Authorization: `Basic ${btoa(`${account.fields.username}:${account.fields.token}`)}` };
}

export default defineApp(
  { user: { accounts: { cults: cults.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.cults ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: authorization(account), cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Cults",
        description: "Browse and manage 3D printing models, creators, categories and sales on the Cults marketplace.",
        icons,
      },
    ),
  }),
);
