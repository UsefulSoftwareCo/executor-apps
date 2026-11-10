import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  oauth2,
  object,
  router,
  string,
  withApprovals,
} from "apps";
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const url = "https://api.getjobber.com/api/graphql";
// Jobber requires a dated API version on every request.
const version = "2025-04-16";

const jobber = defineProvider({
  name: "Jobber",
  hosts: ["api.getjobber.com"],
  auth: {
    // Jobber has no personal API keys; every integration is a Developer Center OAuth app.
    // Scopes are configured on the app itself, not requested at authorization time.
    oauth: oauth2({
      authorizationUrl: "https://api.getjobber.com/api/oauth/authorize",
      tokenUrl: "https://api.getjobber.com/api/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: headers(account),
      body: JSON.stringify({ query: "{ account { id name } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ account: object({ id: string(), name: string() }) }) }),
    );
    return { accountInfo: { externalId: data.account.id, displayName: data.account.name } };
  },
});

function headers(account: { fields: { access_token: string } }) {
  return {
    Authorization: `Bearer ${account.fields.access_token}`,
    "Content-Type": "application/json",
    "X-JOBBER-GRAPHQL-VERSION": version,
  };
}

export default defineApp(
  { user: { accounts: { jobber: jobber.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.jobber ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: headers(account), cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Jobber",
        description: "Clients, requests, quotes, jobs, visits, invoices and payments from Jobber's GraphQL API.",
        icons,
      },
    ),
  }),
);
