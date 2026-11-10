import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  object,
  plain,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import { graphqlRouter } from "apps/graphql";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Sourcegraph Cloud lives at sourcegraph.com or <name>.sourcegraph.com.
const hostPattern = /^(?:[a-z0-9][a-z0-9-]*\.)?sourcegraph\.com$/;

function instanceHost(raw: string): string {
  const match = /^(?:https?:\/\/)?([^/\s]+)\/?$/.exec(raw.trim().toLowerCase());
  if (match === null || !hostPattern.test(match[1]))
    throw new Error("Enter your Sourcegraph Cloud host, for example sourcegraph.com or acme.sourcegraph.com.");
  return match[1];
}

const endpoint = (raw: string) => `https://${instanceHost(raw)}/.api/graphql`;

const sourcegraph = defineProvider({
  name: "Sourcegraph",
  hosts: ["sourcegraph.com", "*.sourcegraph.com"],
  auth: {
    // Access token from User settings > Access tokens. Sourcegraph OAuth clients are created
    // by instance administrators (Administration > OAuth clients), so there is no per-user
    // OAuth app flow to declare here; a token is the route any user can set up.
    accessToken: secrets({
      label: "Access token",
      fields: object({
        instance: plain(string({ minLength: 1 })),
        token: string({ minLength: 1 }),
      }),
      request: ({ token }) => header("Authorization", t`token ${token}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const host = instanceHost(account.fields.instance);
    const response = await fetch(endpoint(account.fields.instance), {
      method: "POST",
      signal,
      headers: { ...account.headers(), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ currentUser { id username } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ currentUser: object({ id: string(), username: string() }) }) }),
    );
    return {
      accountInfo: {
        externalId: `${host}:${data.currentUser.id}`,
        displayName: data.currentUser.username,
        profileUrl: `https://${host}/users/${data.currentUser.username}`,
      },
    };
  },
});

export default defineApp(
  { user: { accounts: { sourcegraph: sourcegraph.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.sourcegraph ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({
              url: endpoint(account.fields.instance),
              account,
              headers: account.headers(),
              cache,
              signal,
            }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Sourcegraph",
        description:
          "Code search, repositories, commits, symbols, batch changes and the rest of Sourcegraph's GraphQL API.",
        icons,
      },
    ),
  }),
);
