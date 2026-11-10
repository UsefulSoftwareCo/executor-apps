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

const url = "https://api.enigma.com/graphql";

const enigma = defineProvider({
  name: "Enigma",
  hosts: ["api.enigma.com"],
  auth: {
    // Enigma issues API keys from its console; there is no OAuth.
    apiKey: secrets({
      label: "API key",
      fields: object({ apiKey: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "x-api-key": account.fields.apiKey, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    await decodeJson(response, object({ data: object({ __typename: string() }) }));
    return { accountInfo: { externalId: "enigma", displayName: "Enigma" } };
  },
});

export default defineApp(
  { user: { accounts: { enigma: enigma.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.enigma ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({
              url,
              account,
              headers: { "x-api-key": account.fields.apiKey },
              cache,
              signal,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Enigma",
        description: "U.S. business data from Enigma's GraphQL API: brands, legal entities, locations, card revenue and verification.",
        icons,
      },
    ),
  }),
);
