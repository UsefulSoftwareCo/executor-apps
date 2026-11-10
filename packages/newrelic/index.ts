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

const usUrl = "https://api.newrelic.com/graphql";
const euUrl = "https://api.eu.newrelic.com/graphql";
const jpUrl = "https://api.jp.newrelic.com/graphql";

const newrelic = defineProvider({
  name: "New Relic",
  hosts: ["api.newrelic.com", "api.eu.newrelic.com", "api.jp.newrelic.com"],
  auth: {
    apiKey: secrets({
      label: "User API key (US region)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    apiKeyEu: secrets({
      label: "User API key (EU region)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    apiKeyJp: secrets({
      label: "User API key (JP region)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(endpoint(account), {
      method: "POST",
      signal,
      headers: { "API-Key": account.fields.token, "content-type": "application/json" },
      body: JSON.stringify({ query: "{ actor { __typename } }" }),
    });
    // Only the always-present __typename is decoded: user id/name/email nullability is unverified,
    // and a rejected key returns an error with no data, so a successful decode proves the key works.
    await decodeJson(response, object({ data: object({ actor: object({ __typename: string() }) }) }));
    return {};
  },
});

function endpoint(account: { method: "apiKey" | "apiKeyEu" | "apiKeyJp" }) {
  if (account.method === "apiKeyEu") return euUrl;
  return account.method === "apiKeyJp" ? jpUrl : usUrl;
}

export default defineApp(
  { user: { accounts: { newrelic: newrelic.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.newrelic ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({
              url: endpoint(account),
              account,
              headers: { "API-Key": account.fields.token },
              cache,
              signal,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "New Relic",
        description: "Query telemetry with NRQL, manage alerts, entities, dashboards and accounts through NerdGraph.",
        icons,
      },
    ),
  }),
);
