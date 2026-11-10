import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://gql.waveapps.com/graphql/public";

const wave = defineProvider({
  name: "Wave Accounting",
  hosts: ["gql.waveapps.com"],
  auth: {
    apiKey: secrets({
      label: "Full access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Wave has no client registration: the connect page asks for an OAuth application's client.
    oauth: oauth2({
      authorizationUrl: "https://api.waveapps.com/oauth2/authorize/",
      tokenUrl: "https://api.waveapps.com/oauth2/token/",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "account:read",
        "account:write",
        "business:read",
        "business:write",
        "customer:read",
        "customer:write",
        "invoice:read",
        "invoice:write",
        "product:read",
        "product:write",
        "transaction:write",
        "user:read",
        "vendor:read",
        "vendor:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { ...authorization(account), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ user { id } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ user: object({ id: string() }) }) }),
    );
    return {
      accountInfo: { externalId: data.user.id },
    };
  },
});

function authorization(
  account: { method: "apiKey"; fields: { token: string } } | { method: "oauth"; fields: { access_token: string } },
) {
  return {
    Authorization: `Bearer ${account.method === "oauth" ? account.fields.access_token : account.fields.token}`,
  };
}

export default defineApp(
  { user: { accounts: { wave: wave.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.wave ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: authorization(account), cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Wave Accounting",
        description: "Businesses, customers, invoices, products, accounts and transactions in Wave's GraphQL API.",
        icons,
      },
    ),
  }),
);
