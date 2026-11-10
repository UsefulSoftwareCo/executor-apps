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
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { options } from "./openapi.js";

const convex = defineProvider({
  name: "Convex",
  hosts: ["api.convex.dev"],
  auth: {
    apiKey: secrets({
      label: "Access token (personal, team or preview deploy key)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Convex has no client registration: the connect page asks for an OAuth app's client.
    // Scope is chosen by the authorize endpoint (team vs project), not a scope parameter.
    oauth: oauth2({
      authorizationUrl: "https://dashboard.convex.dev/oauth/authorize/team",
      tokenUrl: "https://api.convex.dev/oauth/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch("https://api.convex.dev/v1/token_details", {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { convex: convex.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.convex ?? [],
        (account) =>
          withApprovals(liveOpenapiRouter({ ...options, cache, fetch, signal, account }), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Convex",
        description: "Manage Convex teams, projects, deployments, deploy keys, custom domains and environment variables.",
        icons,
      },
    ),
  }),
);
