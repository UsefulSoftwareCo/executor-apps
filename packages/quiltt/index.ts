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
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const graphqlUrl = "https://api.quiltt.io/v1/graphql";

const quiltt = defineProvider({
  name: "Quiltt",
  hosts: ["api.quiltt.io"],
  auth: {
    // Environment-scoped API key secret: administration over the REST API.
    apiKey: secrets({
      label: "API key secret (REST administration only)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // A Profile id plus the API key secret also reaches that Profile's GraphQL data, through Basic auth.
    profile: secrets({
      label: "API key secret and Profile ID (REST and Profile GraphQL)",
      fields: object({ profileId: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    if (account.method === "profile") {
      const response = await fetch(graphqlUrl, {
        method: "POST",
        signal,
        headers: { ...basic(account.fields), "content-type": "application/json" },
        body: JSON.stringify({ query: "{ profile { id } }" }),
      });
      const { data } = await decodeJson(response, object({ data: object({ profile: object({ id: string() }) }) }));
      return { accountInfo: { externalId: data.profile.id, displayName: data.profile.id } };
    }
    const response = await fetch("https://api.quiltt.io/v1/profiles?limit=1", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

function basic(fields: { profileId: string; token: string }) {
  return { Authorization: `Basic ${btoa(`${fields.profileId}:${fields.token}`)}` };
}

const approve = (tool: { kind: string }) => (tool.kind === "mutation" ? always() : undefined);

export default defineApp(
  { user: { accounts: { quiltt: quiltt.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.quiltt ?? [],
        async (account) => {
          const rest = withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), approve);
          if (account.method !== "profile") return router({ rest }, { title: "Quiltt" });
          const profile = withApprovals(
            await graphqlRouter({ url: graphqlUrl, account, headers: basic(account.fields), cache, signal }),
            approve,
          );
          return router({ rest, profile }, { title: "Quiltt" });
        },
        { signal },
      ),
      {
        title: "Quiltt",
        description: "Quiltt financial data: Profiles, connections, accounts, institutions, webhooks and provider APIs over REST, plus connections, accounts, transactions and statements over a Profile's GraphQL API.",
        icons,
      },
    ),
  }),
);
