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

const url = "https://api.monday.com/v2";

const monday = defineProvider({
  name: "Monday",
  hosts: ["api.monday.com"],
  auth: {
    apiKey: secrets({
      label: "Personal API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // monday.com has no client registration: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://auth.monday.com/oauth2/authorize",
      tokenUrl: "https://auth.monday.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "me:read",
        "account:read",
        "boards:read",
        "boards:write",
        "workspaces:read",
        "workspaces:write",
        "users:read",
        "teams:read",
        "updates:read",
        "updates:write",
        "assets:read",
        "tags:read",
        "docs:read",
        "docs:write",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { ...authorization(account), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ me { id name } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ me: object({ id: string(), name: string() }) }) }),
    );
    return { accountInfo: { externalId: data.me.id, displayName: data.me.name } };
  },
});

// Personal tokens are sent raw (no Bearer prefix) per https://developer.monday.com/api-reference/docs/authentication.
// OAuth access tokens are also sent raw: monday's OAuth migration guide shows the /v2 call with the raw token.
// monday's OAuth page calls them "bearer" tokens; the docs do not state the
// header form for OAuth explicitly, so this follows the migration guide example.
function authorization(
  account: { method: "apiKey"; fields: { token: string } } | { method: "oauth"; fields: { access_token: string } },
) {
  return {
    Authorization: account.method === "oauth" ? account.fields.access_token : account.fields.token,
  };
}

export default defineApp(
  { user: { accounts: { monday: monday.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.monday ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: authorization(account), cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Monday",
        description: "Boards, items, columns, updates, workspaces, users and the rest of monday.com's GraphQL Platform API.",
        icons,
      },
    ),
  }),
);
