import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  number,
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

const url = "https://api.matterport.com/api/models/graph";

const matterport = defineProvider({
  name: "Matterport",
  hosts: ["api.matterport.com"],
  auth: {
    apiKey: secrets({
      label: "API token",
      fields: object({ tokenId: string({ minLength: 1 }), tokenSecret: string({ minLength: 1 }) }),
    }),
    // Matterport OAuth apps are created in Settings > Developer Tools; the connect page asks for the client.
    oauth: oauth2({
      authorizationUrl: "https://authn.matterport.com/oauth/authorize",
      tokenUrl: "https://api.matterport.com/api/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: ["ViewPublic", "ViewDetails", "EditDetails", "DownloadAssets"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { ...authorization(account), "content-type": "application/json" },
      body: JSON.stringify({ query: '{ models(query: "*") { totalResults } }' }),
    });
    await decodeJson(response, object({ data: object({ models: object({ totalResults: number() }) }) }));
  },
});

// API tokens use HTTP Basic (token ID as username, secret as password); OAuth tokens are bearer tokens.
function authorization(
  account:
    | { method: "apiKey"; fields: { tokenId: string; tokenSecret: string } }
    | { method: "oauth"; fields: { access_token: string } },
) {
  return {
    Authorization:
      account.method === "oauth"
        ? `Bearer ${account.fields.access_token}`
        : `Basic ${btoa(`${account.fields.tokenId}:${account.fields.tokenSecret}`)}`,
  };
}

export default defineApp(
  { user: { accounts: { matterport: matterport.many() } }, icons },
  async ({ user, cache, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.matterport ?? [],
        async (account) =>
          withApprovals(
            await graphqlRouter({ url, account, headers: authorization(account), cache, signal }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          ),
        { signal },
      ),
      {
        title: "Matterport",
        description: "Search 3D models, read details, assets and floors, and manage models through Matterport's Model GraphQL API.",
        icons,
      },
    ),
  }),
);
