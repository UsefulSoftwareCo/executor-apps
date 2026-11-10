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

const url = "https://api.buffer.com";

const buffer = defineProvider({
  name: "Buffer",
  hosts: ["api.buffer.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Buffer has no dynamic client registration for this flow: the connect page asks for an OAuth app's client.
    oauth: oauth2({
      authorizationUrl: "https://auth.buffer.com/auth",
      tokenUrl: "https://auth.buffer.com/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "offline_access",
        "account:read",
        "account:write",
        "posts:read",
        "posts:write",
        "ideas:read",
        "ideas:write",
        "snippets:read",
        "snippets:write",
      ],
      authorizationParams: { prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { ...authorization(account), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ account { id email } }" }),
    });
    const { data } = await decodeJson(
      response,
      object({ data: object({ account: object({ id: string(), email: string() }) }) }),
    );
    return { accountInfo: { externalId: data.account.id, email: data.account.email } };
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
  { user: { accounts: { buffer: buffer.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.buffer ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: authorization(account), cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Buffer",
        description: "Channels, posts, scheduling, ideas, tags and post metrics from Buffer's GraphQL API.",
        icons,
      },
    ),
  }),
);
