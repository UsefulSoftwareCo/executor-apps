import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  jsonSchema,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const endpoints = {
  production: "https://payments.braintree-api.com/graphql",
  sandbox: "https://payments.sandbox.braintree-api.com/graphql",
} as const;

function endpoint(environment: unknown) {
  return environment === "sandbox" ? endpoints.sandbox : endpoints.production;
}

// Braintree requires a date-stamped API version on every GraphQL request.
const version = "2019-01-01";

const braintree = defineProvider({
  name: "Braintree",
  hosts: ["payments.braintree-api.com", "payments.sandbox.braintree-api.com"],
  auth: {
    // Braintree only issues OAuth tokens to registered partner integrations, so merchants use gateway API keys.
    apiKeys: secrets({
      label: "Gateway API keys",
      fields: object({
        environment: plain(jsonSchema({ type: "string", enum: ["production", "sandbox"] })),
        publicKey: plain(string({ minLength: 1 })),
        privateKey: string({ minLength: 1 }),
      }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(endpoint(account.fields.environment), {
      method: "POST",
      signal,
      headers: headers(account),
      body: JSON.stringify({ query: "query { ping }" }),
    });
    await decodeJson(response, object({ data: object({ ping: string() }) }));
    return { accountInfo: { externalId: account.fields.publicKey, displayName: `Braintree ${account.fields.environment}` } };
  },
});

function headers(account: { fields: { publicKey: string; privateKey: string } }) {
  return {
    Authorization: `Basic ${btoa(`${account.fields.publicKey}:${account.fields.privateKey}`)}`,
    "Braintree-Version": version,
    "Content-Type": "application/json",
  };
}

export default defineApp(
  { user: { accounts: { braintree: braintree.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.braintree ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({
              url: endpoint(account.fields.environment),
              account,
              headers: headers(account),
              cache,
              signal,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Braintree",
        description: "Braintree payments: transactions, vaulted payment methods, customers, refunds, disputes and reports.",
        icons,
      },
    ),
  }),
);
