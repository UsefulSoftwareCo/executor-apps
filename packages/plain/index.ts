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

const url = "https://core-api.uk.plain.com/graphql/v1";

const plain = defineProvider({
  name: "Plain",
  hosts: ["core-api.uk.plain.com"],
  auth: {
    apiKey: secrets({
      label: "Machine user API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ myWorkspace { id name } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ myWorkspace: object({ id: string(), name: string() }).optional() }) }),
    );
    if (!data.myWorkspace) throw new Error("Plain returned no workspace for this API key; check that it is a valid machine user key.");
    return { accountInfo: { externalId: data.myWorkspace.id, displayName: data.myWorkspace.name } };
  },
});

export default defineApp(
  { user: { accounts: { plain: plain.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.plain ?? [],
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
        title: "Plain",
        description: "Support threads, customers, companies, labels, tenants and the rest of Plain's GraphQL API.",
        icons,
      },
    ),
  }),
);
